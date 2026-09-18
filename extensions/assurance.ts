import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import {
	getAgentDir,
	type ExtensionAPI,
	type ExtensionCommandContext,
	type SessionEntry,
} from "@oh-my-pi/pi-coding-agent";
import { createInProcessOmpStatsReader } from "../src/session/omp-stats";
import { readRuntimeEntries } from "../src/session/runtime-entries";
import { deriveRuntimeEvidence, runtimeSourceCoverage } from "../src/assurance/runtime-facts";
import { BUILTIN_ASSURANCE_RULES } from "../src/assurance/registry";
import { renderAssuranceReport } from "../src/assurance/render";
import type { AssuranceReport } from "../src/assurance/model";
import { readAssuranceReport, readTraceOnlyAssuranceReport } from "../scripts/session_assurance";

export type AssuranceCommandMode = "scan" | "full";

export interface AssuranceOutputPaths {
	readonly directory: string;
	readonly text: string;
	readonly json: string;
}

export type AssuranceCommandRunner = (
	mode: AssuranceCommandMode,
	ctx: ExtensionCommandContext,
) => Promise<void>;

export type AssuranceFailureStage =
	| "runtime-read"
	| "stats-report"
	| "render"
	| "persist"
	| "ui";

export class AssuranceStageError extends Error {
	constructor(readonly stage: AssuranceFailureStage) {
		super(`Assurance failed at ${stage}`);
		this.name = "AssuranceStageError";
	}
}

async function atStage<T>(stage: AssuranceFailureStage, operation: () => T | Promise<T>): Promise<T> {
	try {
		return await operation();
	} catch {
		throw new AssuranceStageError(stage);
	}
}

export function parseAssuranceCommandMode(args: string): AssuranceCommandMode | null {
	const value = args.trim();
	if (!value) return "scan";
	if (value === "full") return "full";
	return null;
}

function safePathSegment(value: string): string {
	return /^[A-Za-z0-9._-]+$/.test(value) ? value : encodeURIComponent(value).replace(/%/g, "_");
}

export function assuranceOutputPaths(agentDir: string, sessionId: string, mode: AssuranceCommandMode): AssuranceOutputPaths {
	const directory = join(agentDir, "omp-kit", "assurance", safePathSegment(sessionId));
	return {
		directory,
		text: join(directory, mode === "full" ? "full.txt" : "scan.txt"),
		json: join(directory, mode === "full" ? "full.json" : "scan.json"),
	};
}

export async function persistAssuranceOutput(
	paths: AssuranceOutputPaths,
	report: AssuranceReport,
	rendered: string,
): Promise<void> {
	await mkdir(paths.directory, { recursive: true });
	const token = randomUUID();
	const textTemp = `${paths.text}.${token}.tmp`;
	const jsonTemp = `${paths.json}.${token}.tmp`;
	try {
		await Promise.all([
			writeFile(textTemp, `${rendered}\n`, "utf8"),
			writeFile(jsonTemp, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
		]);
		await rename(textTemp, paths.text);
		await rename(jsonTemp, paths.json);
	} finally {
		await Promise.all([
			rm(textTemp, { force: true }).catch(() => undefined),
			rm(jsonTemp, { force: true }).catch(() => undefined),
		]);
	}
}

function registryFor(report: AssuranceReport) {
	const enabled = new Set(report.rules.map(rule => rule.ruleId));
	return BUILTIN_ASSURANCE_RULES.filter(rule => enabled.has(rule.meta.id));
}

function summaryLines(
	mode: AssuranceCommandMode,
	report: AssuranceReport,
	paths: AssuranceOutputPaths,
): string[] {
	const attention = report.rules
		.filter(rule => rule.presentation.section === "attention")
		.reduce((sum, rule) => sum + rule.findings.length, 0);
	const evidence = report.rules
		.filter(rule => rule.presentation.section === "evidence")
		.reduce((sum, rule) => sum + rule.findings.length, 0);
	const lines = [
		`Assurance ${mode}: ${attention} attention | ${evidence} evidence`,
	];
	if (report.runtime) {
		const active = report.runtime.entries.filter(entry => entry.branch === "active").length;
		const offBranch = report.runtime.entries.length - active;
		lines.push(report.runtime.retainedTree
			? `Main tree: ${active} active | ${offBranch} off-branch`
			: `Main branch: ${active} retained entries`);
		const terminals = report.runtime.jobResolutions.map(item => `${item.jobId}=${item.status}`);
		if (terminals.length) lines.push(`Job terminals: ${terminals.slice(0, 3).join(", ")}${terminals.length > 3 ? " ..." : ""}`);
	}
	lines.push(`Saved: ${paths.directory}`);
	return lines.slice(0, 10);
}

export async function runCurrentSessionAssurance(
	pi: ExtensionAPI,
	mode: AssuranceCommandMode,
	ctx: ExtensionCommandContext,
): Promise<void> {
	await ctx.waitForIdle();
	const sessionId = ctx.sessionManager.getSessionId();
	const sessionFile = ctx.sessionManager.getSessionFile();
	if (!sessionFile) {
		ctx.ui.notify("Assurance needs a persisted OMP session before it can scan.", "warning");
		return;
	}

	const runtimeFacts = await atStage("runtime-read", async () => {
		const activeRead = readRuntimeEntries<SessionEntry>(ctx.sessionManager, "active-branch-entries");
		const selectedRead = mode === "full"
			? readRuntimeEntries<SessionEntry>(ctx.sessionManager, "all-retained-entries")
			: activeRead;
		const runtime = deriveRuntimeEvidence(
			selectedRead,
			mode === "full" ? activeRead : undefined,
			mode === "full"
				? { classifyTools: true, workspaceRoot: null, homeDir: homedir() }
				: {},
		);
		const coverage = mode === "full"
			? [
				runtimeSourceCoverage(activeRead, "runtime-active"),
				runtimeSourceCoverage(selectedRead, "runtime-retained"),
			]
			: [runtimeSourceCoverage(activeRead, "runtime-active")];
		return { runtime, coverage };
	});

	const signal = AbortSignal.timeout(mode === "full" ? 30_000 : 15_000);
	const reader = createInProcessOmpStatsReader();
	const report = await atStage("stats-report", () => mode === "full"
		? readAssuranceReport(reader, sessionFile, signal, undefined, {
			runtime: runtimeFacts.runtime,
			coverage: runtimeFacts.coverage,
		})
		: readTraceOnlyAssuranceReport(reader, sessionFile, signal, {
			runtime: runtimeFacts.runtime,
			coverage: runtimeFacts.coverage,
		}));

	const rendered = await atStage("render", () => renderAssuranceReport(report, registryFor(report)));
	const paths = assuranceOutputPaths(getAgentDir(), sessionId, mode);
	await atStage("persist", () => persistAssuranceOutput(paths, report, rendered));
	await atStage("ui", async () => {
		ctx.ui.setWidget("omp-kit-assurance", summaryLines(mode, report, paths), { placement: "aboveEditor" });
		ctx.ui.notify(`Assurance ${mode} saved.`, "info");
	});
}

export function registerAssuranceCommand(
	pi: ExtensionAPI,
	runner: AssuranceCommandRunner = (mode, ctx) => runCurrentSessionAssurance(pi, mode, ctx),
): void {
	pi.registerCommand("assurance", {
		description: "Review the current OMP session; use /assurance full for retained-tree investigation",
		handler: async (args, ctx) => {
			const mode = parseAssuranceCommandMode(args);
			if (!mode) {
				ctx.ui.notify("Usage: /assurance [full]", "warning");
				return;
			}
			try {
				await runner(mode, ctx);
			} catch (error) {
				pi.logger.warn("omp-kit assurance command failed", {
					error: error instanceof Error ? error.message : String(error),
				});
				const stage = error instanceof AssuranceStageError ? error.stage : "unknown";
				ctx.ui.notify(`Could not produce the assurance report (stage: ${stage}).`, "error");
			}
		},
	});
}

export default function assuranceExtension(pi: ExtensionAPI): void {
	registerAssuranceCommand(pi);
}
