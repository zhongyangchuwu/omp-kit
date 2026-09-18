import { createHash } from "node:crypto";
import type { SessionSummary, SessionTrace, TraceSpan, TraceTrack } from "@oh-my-pi/omp-stats/shared-types";

export const SESSION_EVIDENCE_SCHEMA = "omp-kit.session-evidence/v1" as const;
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

export type ProviderResolver = (trackFile: string, span: TraceSpan) => Promise<string | null>;

export function sessionKey(file: string): string {
	return createHash("sha256").update(file).digest("hex").slice(0, 32);
}

export function sessionRevision(summary: SessionSummary): string {
	return [summary.endedAt, summary.requests, summary.toolCalls, summary.subagents, summary.totalTokens].join(":");
}

/**
 * Match a user-facing project filter against current or stored public OMP metadata.
 *
 * OMP 18.2.1+ exposes the real working directory in SessionSummary.folder, so
 * current collection can filter before trace reads. Stored v1 evidence also
 * retains trace cwd, and accepting both fields keeps summaries created around
 * the pre-18.2.1 folder bug queryable without reproducing OMP storage encoding.
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

export function feedbackForTrace(trace: SessionTrace, bySessionFile: Map<string, FeedbackLink[]>): FeedbackLink[] {
	const deduped = new Map<string, FeedbackLink>();
	for (const track of trace.tracks) {
		for (const link of bySessionFile.get(track.file) ?? []) deduped.set(link.id, link);
	}
	return [...deduped.values()].sort((a, b) => a.id.localeCompare(b.id));
}
