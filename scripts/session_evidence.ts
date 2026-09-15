#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getAgentDir } from "@oh-my-pi/pi-coding-agent";
import type { SessionSummary, SessionTrace, TraceSpan, TraceTrack } from "@oh-my-pi/omp-stats/shared-types";

import { requireRead, withOmpStats } from "../src/session/omp-access";

export const SESSION_EVIDENCE_SCHEMA = "omp-kit.session-evidence/v1" as const;
export const SESSION_EVIDENCE_INDEX_SCHEMA = "omp-kit.session-evidence-index/v1" as const;
export const SESSION_EVIDENCE_REPORT_SCHEMA = "omp-kit.session-evidence-report/v1" as const;

export type AgentType = "main" | "subagent" | "advisor";

export interface FeedbackLink {
	id: string;
	category: string;
	severity: string;
}

export interface ModelCallSummary {
	model: string;
	provider: string | null;
	requests: number;
	errors: number;
	tokens: number;
	costTotal: number;
	totalMs: number;
	avgTtftMs: number | null;
}

export interface TrackSummary {
	id: string;
	parentId: string | null;
	label: string;
	agent: string | null;
	agentType: AgentType;
	model: string | null;
	requests: number;
	toolCalls: number;
	toolErrors: number;
	tokens: number;
	costTotal: number;
	modelMs: number;
	toolMs: number;
}

export interface SessionEvidence {
	schemaVersion: typeof SESSION_EVIDENCE_SCHEMA;
	key: string;
	collectedAt: string;
	source: { file: string; revision: string; mtimeMs: number };
	session: {
		folder: string;
		cwd: string | null;
		title: string | null;
		startedAt: number;
		endedAt: number;
		wallMs: number;
		requests: number;
		toolCalls: number;
		subagents: number;
		totalTokens: number;
		costTotal: number;
		unpricedRequests: number;
		models: string[];
	};
	timing: { modelMs: number; toolMs: number; idleMs: number };
	delegation: {
		mainRequests: number;
		subagentRequests: number;
		advisorRequests: number;
		subagentTracks: number;
		advisorTracks: number;
		subagentEnvelopeMs: number;
		subagentEnvelopeOverlapMs: number;
	};
	modelCalls: ModelCallSummary[];
	tools: Array<{ tool: string; calls: number; errors: number; totalMs: number; maxMs: number }>;
	tracks: TrackSummary[];
	feedback: { count: number; links: FeedbackLink[] };
}

export interface EvidenceIndex {
	schemaVersion: typeof SESSION_EVIDENCE_INDEX_SCHEMA;
	updatedAt: string;
	sessions: Record<string, { key: string; revision: string; collectedAt: string }>;
}

export interface EvidenceReport {
	schemaVersion: typeof SESSION_EVIDENCE_REPORT_SCHEMA;
	generatedAt: string;
	filters: { folder: string | null; since: number | null };
	sessions: number;
	folders: string[];
	totals: {
		requests: number;
		toolCalls: number;
		subagents: number;
		totalTokens: number;
		costTotal: number;
		unpricedRequests: number;
		wallMs: number;
		modelMs: number;
		toolMs: number;
		idleMs: number;
		feedback: number;
	};
	byAgentType: Record<AgentType, { requests: number; tracks: number }>;
	models: ModelCallSummary[];
	tools: Array<{ tool: string; calls: number; errors: number; totalMs: number; maxMs: number }>;
	feedbackCategories: Record<string, number>;
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
type ProviderResolver = (trackFile: string, span: TraceSpan) => Promise<string | null>;

const DEFAULT_LIMIT = 1000;

export function defaultEvidenceRoot(): string {
	return process.env.OMP_KIT_EVIDENCE_DIR ?? join(getAgentDir(), "omp-kit", "session-evidence");
}

export function sessionKey(file: string): string {
	return createHash("sha256").update(file).digest("hex").slice(0, 32);
}

export function sessionRevision(summary: SessionSummary): string {
	return [summary.endedAt, summary.requests, summary.toolCalls, summary.subagents, summary.totalTokens].join(":");
}

/**
 * Match a user-facing project filter against public OMP metadata.
 *
 * OMP 18.1.21 can expose a storage-key-like value such as `-project-omp-kit`
 * in `/api/sessions.folder` for sessions whose real cwd is
 * `/home/user/project/omp-kit`. `/api/session/trace.cwd` remains the public
 * filesystem-path field. Accept both representations instead of reproducing
 * OMP's session-directory encoding rules locally.
 */
export function folderFilterMatches(filter: string, summaryFolder: string, cwd: string | null | undefined): boolean {
	const needle = filter.trim();
	if (needle.length === 0) return true;
	return summaryFolder.includes(needle) || (typeof cwd === "string" && cwd.includes(needle));
}

export function agentTypeForTrack(track: TraceTrack): AgentType {
	if (track.id === "main") return "main";
	return track.id.split("/").at(-1) === "__advisor" ? "advisor" : "subagent";
}

function sumDuration(spans: TraceSpan[]): number {
	return spans.reduce((total, span) => total + Math.max(0, span.end - span.start), 0);
}

function trackEnvelope(track: TraceTrack): [number, number] | null {
	if (track.spans.length === 0) return null;
	let start = Number.POSITIVE_INFINITY;
	let end = Number.NEGATIVE_INFINITY;
	for (const span of track.spans) {
		start = Math.min(start, span.start);
		end = Math.max(end, span.end);
	}
	return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null;
}

/** Coarse coordination overlap: time when two or more subagent track envelopes are active. */
export function envelopeOverlapMs(intervals: Array<[number, number]>): number {
	const events: Array<[number, number]> = [];
	for (const [start, end] of intervals) {
		if (end > start) events.push([start, 1], [end, -1]);
	}
	events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	let active = 0;
	let previous: number | null = null;
	let overlap = 0;
	for (const [time, delta] of events) {
		if (previous !== null && active >= 2) overlap += Math.max(0, time - previous);
		active += delta;
		previous = time;
	}
	return overlap;
}

export function summarizeTrack(track: TraceTrack): TrackSummary {
	const models = track.spans.filter(span => span.kind === "model");
	const tools = track.spans.filter(span => span.kind === "tool");
	return {
		id: track.id,
		parentId: track.parentId,
		label: track.label,
		agent: track.agent,
		agentType: agentTypeForTrack(track),
		model: track.model,
		requests: models.length,
		toolCalls: tools.length,
		toolErrors: tools.filter(span => span.isError).length,
		tokens: models.reduce((total, span) => total + (span.tokens ?? 0), 0),
		costTotal: models.reduce((total, span) => total + (span.cost ?? 0), 0),
		modelMs: sumDuration(models),
		toolMs: sumDuration(tools),
	};
}

async function summarizeModels(trace: SessionTrace, resolveProvider: ProviderResolver): Promise<ModelCallSummary[]> {
	const rows = new Map<string, ModelCallSummary & { ttftTotal: number; ttftCount: number }>();
	for (const track of trace.tracks) {
		for (const span of track.spans) {
			if (span.kind !== "model") continue;
			const model = span.model ?? track.model ?? span.label;
			const provider = await resolveProvider(track.file, span);
			const key = `${provider ?? ""}\u0000${model}`;
			const row = rows.get(key) ?? {
				model,
				provider,
				requests: 0,
				errors: 0,
				tokens: 0,
				costTotal: 0,
				totalMs: 0,
				avgTtftMs: null,
				ttftTotal: 0,
				ttftCount: 0,
			};
			row.requests += 1;
			row.errors += span.isError ? 1 : 0;
			row.tokens += span.tokens ?? 0;
			row.costTotal += span.cost ?? 0;
			row.totalMs += Math.max(0, span.end - span.start);
			if (span.ttft !== undefined) {
				row.ttftTotal += span.ttft;
				row.ttftCount += 1;
			}
			rows.set(key, row);
		}
	}
	return [...rows.values()]
		.map(({ ttftTotal, ttftCount, ...row }) => ({ ...row, avgTtftMs: ttftCount > 0 ? ttftTotal / ttftCount : null }))
		.sort((a, b) => b.requests - a.requests || a.model.localeCompare(b.model));
}

export async function buildSessionEvidence(
	summary: SessionSummary,
	trace: SessionTrace,
	feedback: FeedbackLink[],
	resolveProvider: ProviderResolver = async () => null,
): Promise<SessionEvidence> {
	const tracks = trace.tracks.map(summarizeTrack);
	const subagentIntervals = trace.tracks
		.filter(track => agentTypeForTrack(track) === "subagent")
		.map(trackEnvelope)
		.filter((interval): interval is [number, number] => interval !== null);
	const requestsByType: Record<AgentType, number> = { main: 0, subagent: 0, advisor: 0 };
	for (const track of tracks) requestsByType[track.agentType] += track.requests;
	return {
		schemaVersion: SESSION_EVIDENCE_SCHEMA,
		key: sessionKey(summary.file),
		collectedAt: new Date().toISOString(),
		source: { file: summary.file, revision: sessionRevision(summary), mtimeMs: trace.mtimeMs },
		session: {
			folder: trace.cwd ?? summary.folder,
			cwd: trace.cwd,
			title: trace.title ?? summary.title,
			startedAt: trace.startedAt,
			endedAt: trace.endedAt,
			wallMs: trace.summary.wallMs,
			requests: trace.summary.requests,
			toolCalls: trace.summary.toolCalls,
			subagents: trace.summary.subagents,
			totalTokens: trace.summary.totalTokens,
			costTotal: trace.summary.costTotal,
			unpricedRequests: trace.summary.unpricedRequests,
			models: summary.models,
		},
		timing: { modelMs: trace.summary.modelMs, toolMs: trace.summary.toolMs, idleMs: trace.summary.idleMs },
		delegation: {
			mainRequests: requestsByType.main,
			subagentRequests: requestsByType.subagent,
			advisorRequests: requestsByType.advisor,
			subagentTracks: tracks.filter(track => track.agentType === "subagent").length,
			advisorTracks: tracks.filter(track => track.agentType === "advisor").length,
			subagentEnvelopeMs: subagentIntervals.reduce((total, [start, end]) => total + Math.max(0, end - start), 0),
			subagentEnvelopeOverlapMs: envelopeOverlapMs(subagentIntervals),
		},
		modelCalls: await summarizeModels(trace, resolveProvider),
		tools: trace.summary.toolStats.map(stat => ({ ...stat })),
		tracks,
		feedback: { count: feedback.length, links: feedback },
	};
}

function mergeModel(target: Map<string, ModelCallSummary>, source: ModelCallSummary): void {
	const key = `${source.provider ?? ""}\u0000${source.model}`;
	const current = target.get(key);
	if (!current) {
		target.set(key, { ...source });
		return;
	}
	const previousRequests = current.requests;
	if (current.avgTtftMs === null) current.avgTtftMs = source.avgTtftMs;
	else if (source.avgTtftMs !== null) {
		current.avgTtftMs =
			(current.avgTtftMs * previousRequests + source.avgTtftMs * source.requests) /
			(previousRequests + source.requests);
	}
	current.requests += source.requests;
	current.errors += source.errors;
	current.tokens += source.tokens;
	current.costTotal += source.costTotal;
	current.totalMs += source.totalMs;
}

export function buildAggregateReport(
	evidence: SessionEvidence[],
	filters: { folder?: string | null; since?: number | null } = {},
): EvidenceReport {
	const folder = filters.folder ?? null;
	const since = filters.since ?? null;
	const selected = evidence.filter(
		item =>
			(!folder || folderFilterMatches(folder, item.session.folder, item.session.cwd)) &&
			(since === null || item.session.endedAt >= since),
	);
	const models = new Map<string, ModelCallSummary>();
	const tools = new Map<string, { tool: string; calls: number; errors: number; totalMs: number; maxMs: number }>();
	const feedbackCategories: Record<string, number> = {};
	const byAgentType: EvidenceReport["byAgentType"] = {
		main: { requests: 0, tracks: 0 },
		subagent: { requests: 0, tracks: 0 },
		advisor: { requests: 0, tracks: 0 },
	};
	const totals: EvidenceReport["totals"] = {
		requests: 0,
		toolCalls: 0,
		subagents: 0,
		totalTokens: 0,
		costTotal: 0,
		unpricedRequests: 0,
		wallMs: 0,
		modelMs: 0,
		toolMs: 0,
		idleMs: 0,
		feedback: 0,
	};
	for (const item of selected) {
		totals.requests += item.session.requests;
		totals.toolCalls += item.session.toolCalls;
		totals.subagents += item.session.subagents;
		totals.totalTokens += item.session.totalTokens;
		totals.costTotal += item.session.costTotal;
		totals.unpricedRequests += item.session.unpricedRequests;
		totals.wallMs += item.session.wallMs;
		totals.modelMs += item.timing.modelMs;
		totals.toolMs += item.timing.toolMs;
		totals.idleMs += item.timing.idleMs;
		totals.feedback += item.feedback.count;
		for (const track of item.tracks) {
			byAgentType[track.agentType].requests += track.requests;
			byAgentType[track.agentType].tracks += 1;
		}
		for (const model of item.modelCalls) mergeModel(models, model);
		for (const tool of item.tools) {
			const row = tools.get(tool.tool) ?? { tool: tool.tool, calls: 0, errors: 0, totalMs: 0, maxMs: 0 };
			row.calls += tool.calls;
			row.errors += tool.errors;
			row.totalMs += tool.totalMs;
			row.maxMs = Math.max(row.maxMs, tool.maxMs);
			tools.set(tool.tool, row);
		}
		for (const link of item.feedback.links) feedbackCategories[link.category] = (feedbackCategories[link.category] ?? 0) + 1;
	}
	return {
		schemaVersion: SESSION_EVIDENCE_REPORT_SCHEMA,
		generatedAt: new Date().toISOString(),
		filters: { folder, since },
		sessions: selected.length,
		folders: [...new Set(selected.map(item => item.session.cwd ?? item.session.folder))].sort(),
		totals,
		byAgentType,
		models: [...models.values()].sort((a, b) => b.requests - a.requests || a.model.localeCompare(b.model)),
		tools: [...tools.values()].sort((a, b) => b.calls - a.calls || a.tool.localeCompare(b.tool)),
		feedbackCategories,
	};
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

export function feedbackForTrace(trace: SessionTrace, bySessionFile: Map<string, FeedbackLink[]>): FeedbackLink[] {
	const deduped = new Map<string, FeedbackLink>();
	for (const track of trace.tracks) {
		for (const link of bySessionFile.get(track.file) ?? []) deduped.set(link.id, link);
	}
	return [...deduped.values()].sort((a, b) => a.id.localeCompare(b.id));
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
	await withOmpStats(async client => {
		await client.sync();
		const summaries = requireRead(await client.listSessions(options.limit));
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

			const trace = requireRead(await client.getTrace(summary.file));
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
					const payload = requireRead(await client.getEntry(trackFile, span.entryId));
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
