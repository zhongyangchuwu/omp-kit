#!/usr/bin/env bun

import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getAgentDir } from "@oh-my-pi/pi-coding-agent";
import { withLocalOmpStats } from "../src/session/omp-stats";
import { requireEvidence } from "../src/session/read-result";
import {
	SESSION_EVIDENCE_SCHEMA,
	buildAggregateReport,
	buildSessionEvidence,
	feedbackForTrace,
	folderFilterMatches,
	sessionKey,
	sessionRevision,
	type EvidenceReport,
	type FeedbackLink,
	type ProviderResolver,
	type SessionEvidence,
} from "../src/evidence/session-evidence";

// Preserve the existing import surface while new consumers use the library directly.
export * from "../src/evidence/session-evidence";

export const SESSION_EVIDENCE_INDEX_SCHEMA = "omp-kit.session-evidence-index/v1" as const;

export interface EvidenceIndex {
	schemaVersion: typeof SESSION_EVIDENCE_INDEX_SCHEMA;
	updatedAt: string;
	sessions: Record<string, { key: string; revision: string; collectedAt: string }>;
}

interface FeedbackRecordLike {
	id?: unknown;
	category?: unknown;
	severity?: unknown;
	sessionFile?: unknown;
}

interface CliOptions {
	command: "collect" | "report" | "help";
	root: string;
	folder: string | null;
	since: number | null;
	limit: number;
	json: boolean;
}

type JsonObject = Record<string, unknown>;

const DEFAULT_LIMIT = 1000;

export function defaultEvidenceRoot(): string {
	return process.env.OMP_KIT_EVIDENCE_DIR ?? join(getAgentDir(), "omp-kit", "session-evidence");
}

function parseSince(value: string | undefined): number | null {
	if (!value) return null;
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) throw new Error(`Invalid --since value: ${value}`);
	return parsed;
}

function readFlag(args: string[], name: string): string | undefined {
	const exact = args.indexOf(name);
	if (exact >= 0) return args[exact + 1];
	const prefix = `${name}=`;
	return args.find(arg => arg.startsWith(prefix))?.slice(prefix.length);
}

export function parseCli(argv: string[]): CliOptions {
	const first = argv[0];
	const command: CliOptions["command"] =
		first === "report" ? "report" : first === "help" || first === "--help" || first === "-h" ? "help" : "collect";
	const args = first === "collect" || first === "report" || command === "help" ? argv.slice(1) : argv;
	const rawLimit = readFlag(args, "--limit");
	const limit = rawLimit === undefined ? DEFAULT_LIMIT : Number.parseInt(rawLimit, 10);
	if (!Number.isFinite(limit) || limit <= 0) throw new Error(`Invalid --limit value: ${rawLimit}`);
	return {
		command,
		root: readFlag(args, "--root") ?? defaultEvidenceRoot(),
		folder: readFlag(args, "--folder") ?? null,
		since: parseSince(readFlag(args, "--since")),
		limit,
		json: args.includes("--json"),
	};
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
	try {
		return JSON.parse(await readFile(path, "utf8")) as T;
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return fallback;
		throw error;
	}
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
	await rename(tmp, path);
}

async function readStoredEvidence(path: string): Promise<SessionEvidence | null> {
	try {
		const value = JSON.parse(await readFile(path, "utf8")) as SessionEvidence;
		return value.schemaVersion === SESSION_EVIDENCE_SCHEMA ? value : null;
	} catch {
		return null;
	}
}

async function readFeedbackBySessionFile(): Promise<Map<string, FeedbackLink[]>> {
	const result = new Map<string, FeedbackLink[]>();
	let content: string;
	try {
		content = await readFile(join(getAgentDir(), "omp-kit", "feedback.jsonl"), "utf8");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return result;
		throw error;
	}
	for (const line of content.split(/\r?\n/)) {
		if (!line.trim()) continue;
		let record: FeedbackRecordLike;
		try {
			record = JSON.parse(line) as FeedbackRecordLike;
		} catch {
			continue;
		}
		if (
			typeof record.id !== "string" ||
			typeof record.category !== "string" ||
			typeof record.severity !== "string" ||
			typeof record.sessionFile !== "string"
		)
			continue;
		const links = result.get(record.sessionFile) ?? [];
		links.push({ id: record.id, category: record.category, severity: record.severity });
		result.set(record.sessionFile, links);
	}
	return result;
}

function providerFromEntry(payload: unknown): string | null {
	if (typeof payload !== "object" || payload === null) return null;
	const entry = (payload as JsonObject).entry;
	if (typeof entry !== "object" || entry === null) return null;
	const message = (entry as JsonObject).message;
	if (typeof message !== "object" || message === null) return null;
	const provider = (message as JsonObject).provider;
	return typeof provider === "string" && provider.length > 0 ? provider : null;
}

async function collect(options: CliOptions): Promise<{ collected: number; skipped: number; report: EvidenceReport }> {
	const sessionsDir = join(options.root, "sessions");
	const indexPath = join(options.root, "index.json");
	await mkdir(sessionsDir, { recursive: true });
	const index = await readJson<EvidenceIndex>(indexPath, {
		schemaVersion: SESSION_EVIDENCE_INDEX_SCHEMA,
		updatedAt: new Date(0).toISOString(),
		sessions: {},
	});
	if (index.schemaVersion !== SESSION_EVIDENCE_INDEX_SCHEMA)
		throw new Error(`Unsupported evidence index schema: ${String(index.schemaVersion)}`);
	const feedbackByFile = await readFeedbackBySessionFile();
	let collected = 0;
	let skipped = 0;
	await withLocalOmpStats(async client => {
		requireEvidence(await client.sync());
		const summaries = requireEvidence(await client.listSessions(options.limit));
		for (const summary of summaries) {
			if (options.since !== null && summary.endedAt < options.since) continue;
			const revision = sessionRevision(summary);
			const key = sessionKey(summary.file);
			const outputPath = join(sessionsDir, `${key}.json`);
			const previous = index.sessions[summary.file];
			const stored = previous?.revision === revision ? await readStoredEvidence(outputPath) : null;
			const storedHasCwd = stored !== null && Object.prototype.hasOwnProperty.call(stored.session, "cwd");
			if (stored?.source.revision === revision && storedHasCwd) {
				if (!options.folder || folderFilterMatches(options.folder, stored.session.folder, stored.session.cwd)) skipped += 1;
				continue;
			}

			const trace = requireEvidence(await client.getTrace(summary.file));
			if (options.folder && !folderFilterMatches(options.folder, summary.folder, trace.cwd)) continue;

			const providerCache = new Map<string, string | null>();
			const resolveProvider: ProviderResolver = async (trackFile, span) => {
				const cacheKey = `${trackFile}\u0000${span.model ?? span.label}`;
				if (providerCache.has(cacheKey)) return providerCache.get(cacheKey) ?? null;
				if (!span.entryId) {
					providerCache.set(cacheKey, null);
					return null;
				}
				try {
					const payload = requireEvidence(await client.getEntry(trackFile, span.entryId));
					const provider = providerFromEntry(payload);
					providerCache.set(cacheKey, provider);
					return provider;
				} catch {
					providerCache.set(cacheKey, null);
					return null;
				}
			};
			const evidence = await buildSessionEvidence(summary, trace, feedbackForTrace(trace, feedbackByFile), resolveProvider);
			await writeJsonAtomic(outputPath, evidence);
			index.sessions[summary.file] = { key, revision, collectedAt: evidence.collectedAt };
			collected += 1;
		}
	});
	index.updatedAt = new Date().toISOString();
	await writeJsonAtomic(indexPath, index);
	return { collected, skipped, report: await loadReport(options) };
}

async function loadEvidence(root: string): Promise<SessionEvidence[]> {
	let names: string[];
	try {
		names = await readdir(join(root, "sessions"));
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
		throw error;
	}
	const result: SessionEvidence[] = [];
	for (const name of names.filter(name => name.endsWith(".json")).sort()) {
		const value = await readStoredEvidence(join(root, "sessions", name));
		if (value) result.push(value);
	}
	return result;
}

async function loadReport(options: Pick<CliOptions, "root" | "folder" | "since">): Promise<EvidenceReport> {
	return buildAggregateReport(await loadEvidence(options.root), { folder: options.folder, since: options.since });
}

function duration(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
	return `${(ms / 60_000).toFixed(1)}m`;
}

function printHumanReport(report: EvidenceReport): void {
	console.log(`Sessions: ${report.sessions}`);
	console.log(`Requests: ${report.totals.requests} | Tools: ${report.totals.toolCalls} | Subagents: ${report.totals.subagents}`);
	console.log(
		`Tokens: ${report.totals.totalTokens} | API-equivalent cost: $${report.totals.costTotal.toFixed(4)} | Unpriced requests: ${report.totals.unpricedRequests}`,
	);
	console.log(
		`Timing: wall ${duration(report.totals.wallMs)} | model ${duration(report.totals.modelMs)} | tool ${duration(report.totals.toolMs)} | idle ${duration(report.totals.idleMs)}`,
	);
	console.log(
		`Agent requests: main ${report.byAgentType.main.requests} | subagent ${report.byAgentType.subagent.requests} | advisor ${report.byAgentType.advisor.requests}`,
	);
	if (report.models.length > 0) {
		console.log("Models:");
		for (const model of report.models.slice(0, 12))
			console.log(
				`  ${model.provider ? `${model.provider}/` : ""}${model.model}: ${model.requests} req, ${model.tokens} tokens, $${model.costTotal.toFixed(4)}`,
			);
	}
	if (report.tools.length > 0) {
		console.log("Tools:");
		for (const tool of report.tools.slice(0, 15))
			console.log(`  ${tool.tool}: ${tool.calls} calls, ${tool.errors} errors, ${duration(tool.totalMs)}`);
	}
	console.log(`Feedback linked: ${report.totals.feedback}`);
}

function printHelp(): void {
	console.log(`omp-kit session evidence\n\nUsage:\n  bun run evidence:collect [--limit N] [--folder TEXT] [--since ISO] [--root PATH] [--json]\n  bun run evidence:report  [--folder TEXT] [--since ISO] [--root PATH] [--json]\n\n--folder accepts the normal project filesystem path (or a folder substring). Matching prefers the public trace cwd and also accepts OMP's summary folder value.\n\nOMP remains the raw session/stat recorder. The collector incrementally derives compact summaries; it does not require per-session logging turns.\n\nDefault derived-data root:\n  ${defaultEvidenceRoot()}\n`);
}

async function main(): Promise<void> {
	const options = parseCli(process.argv.slice(2));
	if (options.command === "help") return printHelp();
	if (options.command === "collect") {
		const result = await collect(options);
		if (options.json) console.log(JSON.stringify(result, null, 2));
		else {
			console.log(`Collected: ${result.collected} | unchanged: ${result.skipped}`);
			printHumanReport(result.report);
		}
		return;
	}
	const report = await loadReport(options);
	if (options.json) console.log(JSON.stringify(report, null, 2));
	else printHumanReport(report);
}

if (import.meta.main) {
	main().catch(error => {
		console.error(error instanceof Error ? error.stack ?? error.message : String(error));
		process.exitCode = 1;
	});
}
