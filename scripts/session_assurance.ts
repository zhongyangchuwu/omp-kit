#!/usr/bin/env bun
import { homedir } from "node:os";
import {
	createOmpStatsClient,
	withLocalOmpStats,
	type OmpStatsClient,
	type SessionEntryReader,
	type SessionTraceReader,
} from "../src/session/omp-stats";
import { folderFilterMatches, sessionKey } from "../src/evidence/session-evidence";
import { buildAssuranceReport } from "../src/assurance/engine";
import type { AssuranceInput, AssuranceReport, AssuranceRule, SourceCoverage } from "../src/assurance/model";
import { DEFAULT_ASSURANCE_PROFILE, resolveAssuranceProfile } from "../src/assurance/profiles";
import { BUILTIN_ASSURANCE_RULES } from "../src/assurance/registry";
import { renderAssuranceReport } from "../src/assurance/render";
import { coverageGapRule } from "../src/assurance/rules/coverage-gap";
import { resolutionGapRule } from "../src/assurance/rules/resolution-gap";
import { missingTerminalRule } from "../src/assurance/rules/terminal-missing";
import { toolErrorRule } from "../src/assurance/rules/tool-error";
import { buildAssuranceScanReport, type AssuranceScanReport, type AssuranceScanRow } from "../src/assurance/scan";
import { createScopeDerivationDiagnostics, deriveTraceScopeEvidence, type ScopeDerivationDiagnostics } from "../src/assurance/scope/derive";
import { BUILTIN_SCOPE_CLASSIFIERS, BUILTIN_SCOPE_TOOL_NAMES } from "../src/assurance/scope/registry";
import { normalizeTraceReads, type TraceInput } from "../src/assurance/trace-observations";

const DEFAULT_PROFILE_RULES = resolveAssuranceProfile(BUILTIN_ASSURANCE_RULES, DEFAULT_ASSURANCE_PROFILE);
const TRACE_SCAN_RULES: readonly AssuranceRule[] = [toolErrorRule, missingTerminalRule, resolutionGapRule, coverageGapRule];
const DEFAULT_LIMIT = 1000;
const SESSION_KEY = /^[a-f0-9]{32}$/;

const HELP = `Usage: omp-kit-assurance --session PATH [--origin http://127.0.0.1:PORT] [--json]
       omp-kit-assurance --key SESSION_KEY [--limit N] [--origin http://127.0.0.1:PORT] [--json]
       omp-kit-assurance scan [--limit N] [--folder TEXT] [--since ISO] [--full] [--origin http://127.0.0.1:PORT] [--json]

Single-session reports include observed Scope V1 and may read selected public OMP
session entries in memory. --key resolves an opaque key emitted by scan without
printing the underlying session path.

scan synchronizes and lists the bounded OMP session catalog, then reads matching
active-branch traces. The default first pass is trace-only: it evaluates tool errors,
missing-terminal evidence, resolution gaps and coverage/conflicts without selected-entry
scope enrichment.
Use --full explicitly to run the complete Scope V1 report for every matched session;
this can issue many selected-entry reads on large histories.

No model call, test execution or publication is performed. Output remains private.
Exit 0 means the requested report/scan was produced, not a safety verdict; exit 2
means discovery or one or more reads/rules were incomplete.
`;

interface BaseOptions {
	origin?: string;
	json: boolean;
}
export interface AssuranceReportOptions extends BaseOptions {
	command?: "report";
	sessionFile?: string;
	sessionKey?: string;
	limit?: number;
}
export interface AssuranceScanOptions extends BaseOptions {
	command: "scan";
	folder: string | null;
	since: number | null;
	limit: number;
	full: boolean;
}
export type AssuranceOptions = AssuranceReportOptions | AssuranceScanOptions;
export type SessionAssuranceReader = SessionTraceReader & Partial<SessionEntryReader> & Partial<Pick<OmpStatsClient, "sync" | "listSessions">>;
export type SessionAssuranceCatalogReader = SessionAssuranceReader & Required<Pick<OmpStatsClient, "sync" | "listSessions">>;
type TraceRead = Awaited<ReturnType<SessionTraceReader["getTrace"]>>;

export interface AssuranceAdditionalFacts {
	readonly runtime?: AssuranceInput["runtime"];
	readonly coverage?: readonly SourceCoverage[];
}

function optionValue(argv: readonly string[], index: number): string {
	const value = argv[index + 1];
	if (!value?.trim() || value.startsWith("--")) throw new Error("Missing assurance option value");
	return value;
}

function parseLimit(value: string): number {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error("Invalid assurance limit");
	return parsed;
}

function parseSince(value: string): number {
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) throw new Error("Invalid assurance since value");
	return parsed;
}

export function parseAssuranceArgs(argv: readonly string[]): AssuranceOptions | null {
	if (argv[0] === "--") argv = argv.slice(1);
	if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) return null;
	const scan = argv[0] === "scan";
	if (argv[0] === "scan" || argv[0] === "report") argv = argv.slice(1);
	let sessionFile: string | undefined;
	let key: string | undefined;
	let origin: string | undefined;
	let folder: string | null = null;
	let since: number | null = null;
	let limit = DEFAULT_LIMIT;
	let limitSpecified = false;
	let json = false;
	let full = false;
	const seen = new Set<string>();
	for (let i = 0; i < argv.length; i++) {
		const flag = argv[i];
		if (seen.has(flag)) throw new Error("Duplicate assurance option");
		seen.add(flag);
		if (flag === "--json") { json = true; continue; }
		if (flag === "--full") { full = true; continue; }
		if (!["--session", "--key", "--origin", "--folder", "--since", "--limit"].includes(flag))
			throw new Error("Unknown assurance option");
		const value = optionValue(argv, i);
		i += 1;
		if (flag === "--session") sessionFile = value;
		else if (flag === "--key") key = value;
		else if (flag === "--origin") origin = value;
		else if (flag === "--folder") folder = value;
		else if (flag === "--since") since = parseSince(value);
		else { limit = parseLimit(value); limitSpecified = true; }
	}
	if (scan) {
		if (sessionFile || key) throw new Error("scan does not accept a single-session selector");
		return { command: "scan", ...(origin ? { origin } : {}), json, limit, folder, since, full };
	}
	if (folder !== null || since !== null || full) throw new Error("report does not accept scan-only options");
	if ((sessionFile ? 1 : 0) + (key ? 1 : 0) !== 1) throw new Error("Exactly one session selector is required");
	if (key && !SESSION_KEY.test(key)) throw new Error("Invalid assurance session key");
	if (sessionFile && limitSpecified) throw new Error("--limit is only used with --key or scan");
	return {
		...(sessionFile ? { sessionFile } : {}),
		...(key ? { sessionKey: key, limit } : {}),
		...(origin ? { origin } : {}),
		json,
	};
}

async function reportFromTraceRead(
	reader: SessionAssuranceReader,
	sessionFile: string,
	read: TraceRead,
	signal: AbortSignal | undefined,
	rules: readonly AssuranceRule[],
	includeScope: boolean,
	diagnostics?: ScopeDerivationDiagnostics,
	additionalFacts: AssuranceAdditionalFacts = {},
): Promise<AssuranceReport> {
	const traceInput: TraceInput = { sourceId: "session", sessionFile, read };
	const normalized = normalizeTraceReads([traceInput]);
	const enriched: AssuranceInput = {
		...normalized,
		coverage: [...normalized.coverage, ...(additionalFacts.coverage ?? [])],
		...(additionalFacts.runtime ? { runtime: additionalFacts.runtime } : {}),
	};
	if (!includeScope) return buildAssuranceReport(enriched, rules);
	const entryReader: SessionEntryReader | undefined = reader.getEntry
		? { getEntry: (file, id, entrySignal) => reader.getEntry!(file, id, entrySignal) }
		: undefined;
	const scope = await deriveTraceScopeEvidence(
		[traceInput],
		enriched,
		entryReader,
		BUILTIN_SCOPE_CLASSIFIERS,
		{
			homeDir: homedir(),
			signal,
			toolNamePrefilter: toolName => BUILTIN_SCOPE_TOOL_NAMES.has(toolName),
			...(diagnostics ? { diagnostics } : {}),
		},
	);
	return buildAssuranceReport({ ...enriched, scope }, rules);
}

export async function readAssuranceReport(
	reader: SessionAssuranceReader,
	sessionFile: string,
	signal?: AbortSignal,
	rules: readonly AssuranceRule[] = DEFAULT_PROFILE_RULES,
	additionalFacts: AssuranceAdditionalFacts = {},
): Promise<AssuranceReport> {
	return reportFromTraceRead(
		reader,
		sessionFile,
		await reader.getTrace(sessionFile, signal),
		signal,
		rules,
		true,
		undefined,
		additionalFacts,
	);
}

export async function readTraceOnlyAssuranceReport(
	reader: SessionAssuranceReader,
	sessionFile: string,
	signal?: AbortSignal,
	additionalFacts: AssuranceAdditionalFacts = {},
): Promise<AssuranceReport> {
	return reportFromTraceRead(
		reader,
		sessionFile,
		await reader.getTrace(sessionFile, signal),
		signal,
		TRACE_SCAN_RULES,
		false,
		undefined,
		additionalFacts,
	);
}

function asCatalogReader(reader: SessionAssuranceReader): SessionAssuranceCatalogReader {
	if (!reader.sync || !reader.listSessions) throw new Error("The selected reader does not support session discovery");
	return reader as SessionAssuranceCatalogReader;
}

async function resolveSessionFile(reader: SessionAssuranceCatalogReader, key: string, limit: number): Promise<string> {
	const signal = AbortSignal.timeout(30_000);
	const sync = await reader.sync(signal);
	if (sync.status !== "available") throw new Error("Could not synchronize the bounded OMP session catalog");
	const listed = await reader.listSessions(limit, signal);
	if (listed.status !== "available") throw new Error("Could not read the bounded OMP session catalog");
	const match = listed.data.find(summary => sessionKey(summary.file) === key);
	if (!match) throw new Error("Session key was not found in the bounded OMP session catalog");
	return match.file;
}

export async function scanAssuranceReports(reader: SessionAssuranceCatalogReader, options: AssuranceScanOptions): Promise<{ report: AssuranceScanReport; incomplete: boolean }> {
	const discoverySignal = AbortSignal.timeout(30_000);
	const sync = await reader.sync(discoverySignal);
	const listed = await reader.listSessions(options.limit, discoverySignal);
	const rows: AssuranceScanRow[] = [];
	if (listed.status === "available") {
		for (const summary of listed.data) {
			if (options.since !== null && summary.endedAt < options.since) continue;
			if (options.folder && !folderFilterMatches(options.folder, summary.folder, null)) continue;
			const signal = AbortSignal.timeout(15_000);
			const read = await reader.getTrace(summary.file, signal);
			const scopeDiagnostics = options.full ? createScopeDerivationDiagnostics() : undefined;
			const report = await reportFromTraceRead(
				reader,
				summary.file,
				read,
				signal,
				options.full ? DEFAULT_PROFILE_RULES : TRACE_SCAN_RULES,
				options.full,
				scopeDiagnostics,
			);
			rows.push({ summary, report, ...(scopeDiagnostics ? { scopeDiagnostics } : {}) });
		}
	}
	const discoveryReason = listed.status !== "available"
		? listed.reason
		: sync.status !== "available" ? `sync-${sync.reason}` : undefined;
	const report = buildAssuranceScanReport(rows, {
		mode: options.full ? "full" : "trace-only",
		folderApplied: options.folder !== null,
		since: options.since,
		limit: options.limit,
		syncAvailable: sync.status === "available",
		listAvailable: listed.status === "available",
		returned: listed.status === "available" ? listed.data.length : 0,
		discoveryLimitations: listed.limitations,
		discoveryReason,
	});
	const incomplete = sync.status !== "available" || listed.status !== "available" ||
		rows.some(row => row.report.coverage.some(source => !source.assessed) || row.report.rules.some(rule => rule.status === "failed"));
	return { report, incomplete };
}

function printScanReport(report: AssuranceScanReport): string {
	const lines = [
		`Assurance scan (${report.mode})`,
		`Sessions: ${report.sessions.scanned} scanned | ${report.sessions.assessed} assessed | ${report.sessions.candidates} candidates`,
		`Actions: ${report.totals.actions} | Subagents: ${report.totals.subagents}`,
		`Attention findings: ${report.totals.attentionFindings} | Dynamic coverage gaps: ${report.totals.dynamicCoverageGaps}`,
		`Catalog: ${report.discovery.returned} returned | ${report.discovery.limitations.join(", ") || "no declared list limit"}`,
	];
	if (!report.discovery.syncAvailable || !report.discovery.listAvailable)
		lines.push(`Discovery incomplete: ${report.discovery.reason ?? "unknown"}`);
	if (report.performance?.scope) {
		const scope = report.performance.scope;
		lines.push(`Scope recovery: ${scope.candidates} candidates | ${scope.prefilteredUnsupported} prefiltered unsupported | ${scope.recoveryAttempts} recovered | ${scope.entryReadRequests} entry reads | ${scope.entryCacheHits} cache hits`);
		lines.push(`Scope timing: ${(scope.totalMs / 1000).toFixed(1)}s total | ${(scope.recoveryMs / 1000).toFixed(1)}s entry recovery | ${(scope.classificationMs / 1000).toFixed(3)}s classification | ${scope.parentHops} parent hops`);
	}
	if (report.candidates.length > 0) {
		lines.push("Candidates:");
		for (const candidate of report.candidates.slice(0, 20)) {
			lines.push(`  ${new Date(candidate.endedAt).toISOString()} ${candidate.key} | attention ${candidate.attentionFindings} | coverage ${candidate.dynamicCoverageGaps} | ${candidate.codes.join(", ")}`);
		}
		if (report.candidates.length > 20) lines.push(`  ... ${report.candidates.length - 20} more candidates in --json output`);
		lines.push("Deep dive: omp-kit-assurance --key SESSION_KEY");
	}
	if (report.mode === "trace-only") lines.push("Scope V1 was not expanded during this first pass; use --full only when bulk scope enrichment is worth the selected-entry cost.");
	return lines.join("\n");
}

/** Injection is for hosts/tests; no UI/storage dependency in the report functions. */
export async function runAssuranceCli(argv: readonly string[], reader?: SessionAssuranceReader): Promise<{ output: string; exitCode: number }> {
	const options = parseAssuranceArgs(argv);
	if (!options) return { output: HELP, exitCode: 0 };
	const use = async (source: SessionAssuranceReader): Promise<{ output: string; exitCode: number }> => {
		if (options.command === "scan") {
			const result = await scanAssuranceReports(asCatalogReader(source), options);
			return { output: options.json ? JSON.stringify(result.report, null, 2) : printScanReport(result.report), exitCode: result.incomplete ? 2 : 0 };
		}
		const sessionFile = options.sessionFile ?? await resolveSessionFile(asCatalogReader(source), options.sessionKey!, options.limit ?? DEFAULT_LIMIT);
		const report = await readAssuranceReport(source, sessionFile, AbortSignal.timeout(15_000));
		const incomplete = report.coverage.some(item => !item.assessed) || report.rules.some(rule => rule.status === "failed");
		return { output: options.json ? JSON.stringify(report, null, 2) : renderAssuranceReport(report, BUILTIN_ASSURANCE_RULES), exitCode: incomplete ? 2 : 0 };
	};
	return reader ? use(reader) : options.origin
		? use(createOmpStatsClient(options.origin))
		: withLocalOmpStats(use, { startLogsToStderr: options.json });
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
