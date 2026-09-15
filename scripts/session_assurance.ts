#!/usr/bin/env bun
import { createOmpStatsClient, withLocalOmpStats, type SessionTraceReader } from "../src/session/omp-stats";
import type { AssuranceReport } from "../src/assurance/model";
import { buildAssuranceReport, renderAssuranceReport } from "../src/assurance/report";
import { normalizeTraceReads } from "../src/assurance/trace-observations";

const HELP = `Usage: omp-kit-assurance --session PATH [--origin http://127.0.0.1:PORT] [--json]

Read one explicit OMP session trace and returned child tracks. No catalog scan,
explicit sync, entry enrichment, model call, test execution or publication.
Without --origin, temporarily owns a local OMP stats server (native startup may
update OMP's local stats). Output remains private. Exit 0 means report produced,
not a safety verdict; exit 2 means invalid usage, an unassessed read or rule failure.
`;
export interface AssuranceOptions { sessionFile: string; origin?: string; json: boolean }

export function parseAssuranceArgs(argv: readonly string[]): AssuranceOptions | null {
	// Package-script runners may forward one leading argument separator.
	if (argv[0] === "--") argv = argv.slice(1);
	if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) return null;
	let sessionFile: string | undefined;
	let origin: string | undefined;
	let json = false;
	const seen = new Set<string>();
	for (let i = 0; i < argv.length; i++) {
		const flag = argv[i];
		if (seen.has(flag)) throw new Error("Duplicate assurance option");
		seen.add(flag);
		if (flag === "--json") { json = true; continue; }
		if (flag !== "--session" && flag !== "--origin") throw new Error("Unknown assurance option");
		const value = argv[++i];
		if (!value?.trim() || value.startsWith("--")) throw new Error("Missing assurance option value");
		if (flag === "--session") sessionFile = value;
		else origin = value;
	}
	if (!sessionFile) throw new Error("An explicit session path is required");
	return { sessionFile, ...(origin ? { origin } : {}), json };
}

export async function readAssuranceReport(reader: SessionTraceReader, sessionFile: string,
	signal?: AbortSignal): Promise<AssuranceReport> {
	const read = await reader.getTrace(sessionFile, signal);
	return buildAssuranceReport(normalizeTraceReads([{ sourceId: "session", sessionFile, read }]));
}

/** Injection is for hosts/tests; no UI/storage dependency in the report functions. */
export async function runAssuranceCli(argv: readonly string[], reader?: SessionTraceReader): Promise<{ output: string; exitCode: number }> {
	const options = parseAssuranceArgs(argv);
	if (!options) return { output: HELP, exitCode: 0 };
	const signal = AbortSignal.timeout(15_000);
	const use = (source: SessionTraceReader) => readAssuranceReport(source, options.sessionFile, signal);
	const report = reader ? await use(reader) : options.origin
		? await use(createOmpStatsClient(options.origin)) : await withLocalOmpStats(use);
	const incomplete = report.coverage.some(source => !source.assessed) || report.rules.some(rule => rule.status === "failed");
	return { output: options.json ? JSON.stringify(report, null, 2) : renderAssuranceReport(report), exitCode: incomplete ? 2 : 0 };
}

if (import.meta.main) {
	runAssuranceCli(process.argv.slice(2)).then(result => {
		console.log(result.output);
		process.exitCode = result.exitCode;
	}).catch(() => {
		console.error("Could not produce the local assurance report. Check --help and the selected OMP environment; no success verdict was produced.");
		process.exitCode = 2;
	});
}
