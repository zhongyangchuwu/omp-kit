import type { SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import { isSessionTrace } from "../session/omp-stats-contract";
import type { EvidenceRead, ReadLimit } from "../session/read-result";
import { assuranceId, compareIds, type ActionObservation, type ActionSample, type AssuranceInput, type SourceCoverage } from "./model";

export interface TraceInput {
	readonly sourceId: string;
	/** Retained by the caller for native drill-down, never copied into the report. */
	readonly sessionFile: string;
	readonly read: EvidenceRead<SessionTrace>;
}

const TRACE_LIMITS: readonly ReadLimit[] = [
	"active-branches-only", "child-completeness-unknown", "details-are-previews", "not-an-atomic-snapshot",
];

/** A pure projection of public traces; no raw journal parsing or payload persistence. */
export function normalizeTraceReads(inputs: readonly TraceInput[]): AssuranceInput {
	const seenSources = new Set<string>();
	const actions = new Map<string, { id: string; kind: ActionObservation["kind"]; samples: Map<string, ActionSample> }>();
	const coverage: SourceCoverage[] = [];
	for (const input of inputs) {
		if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(input.sourceId) || seenSources.has(input.sourceId)) {
			throw new Error("Assurance source IDs must be unique bounded identifiers");
		}
		seenSources.add(input.sourceId);
		const { read, sourceId, sessionFile } = input;
		const sessionKey = assuranceId("session-file", sessionFile);
		let reason: SourceCoverage["reason"];
		if (read.status === "unavailable") reason = read.reason;
		else if (read.consistency === "source-changed") reason = "source-changed";
		else if (read.scope.source !== "omp-stats" || read.scope.view !== "active-branch-trace") reason = "unexpected-view";
		else if (!isSessionTrace(read.data) || read.data.file !== sessionFile ||
			read.data.tracks.some(track => !track.file || !track.id || track.spans.some(span => !span.id))) reason = "invalid-trace";
		const assessed = reason === undefined;
		coverage.push({ sourceId, sessionKey, scope: { ...read.scope }, availability: read.status,
			consistency: read.consistency, startedAt: read.startedAt, finishedAt: read.finishedAt, assessed,
			...(reason ? { reason } : {}),
			...(read.status === "unavailable" && read.httpStatus !== undefined ? { httpStatus: read.httpStatus } : {}), limitations: [...new Set([...TRACE_LIMITS, ...read.limitations])].sort() });
		if (!assessed || read.status !== "available") continue;
		for (const track of read.data.tracks) {
			for (const span of track.spans) {
				if (span.kind !== "tool" && span.kind !== "background") continue;
				// Correlate only native identity. Never match commands, labels or timestamps.
				// Background/legacy spans without a call ID remain source-local conservatively.
				const id = span.kind === "tool" && span.toolCallId
					? assuranceId("tool", track.file, span.toolCallId)
					: assuranceId(span.kind, sourceId, track.file, span.id);
				const evidence = { sourceId, sessionKey, trackId: track.id, spanId: span.id,
					...(span.entryId ? { entryId: span.entryId } : {}),
					...(span.toolCallId ? { toolCallId: span.toolCallId } : {}) };
				const sample: ActionSample = { toolName: span.label,
					terminal: span.unterminated === true ? "missing" : "observed",
					errorReported: span.isError === true, evidence };
				const action = actions.get(id) ?? { id, kind: span.kind, samples: new Map<string, ActionSample>() };
				action.samples.set(JSON.stringify(sample), sample);
				actions.set(id, action);
			}
		}
	}
	return {
		coverage: coverage.sort((a, b) => compareIds({ id: a.sourceId }, { id: b.sourceId })),
		actions: [...actions.values()].sort(compareIds).map(action => ({ id: action.id, kind: action.kind,
			samples: [...action.samples.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, sample]) => sample) })),
	};
}
