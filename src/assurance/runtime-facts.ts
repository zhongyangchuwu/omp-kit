import type { RuntimeEntrySnapshot } from "../session/runtime-entries";
import type { EvidenceRead } from "../session/read-result";
import {
	assuranceId,
	compareIds,
	type RuntimeBranchState,
	type RuntimeEvidence,
	type RuntimeEvidenceLimitation,
	type RuntimeJobResolution,
	type RuntimeJobStatus,
	type RuntimeTreeEntry,
	type SourceCoverage,
} from "./model";

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sessionKeyOf(snapshot: RuntimeEntrySnapshot<unknown>): string {
	return snapshot.sessionFile
		? assuranceId("session-file", snapshot.sessionFile)
		: assuranceId("session-id", snapshot.sessionId);
}

function entryIdentity(entry: unknown): { id: string; parentId: string | null; type: string; timestamp: string | null } | null {
	if (!isObject(entry) || typeof entry.id !== "string" || !entry.id ||
		typeof entry.type !== "string" || !entry.type) return null;
	const parentId = entry.parentId === null || entry.parentId === undefined
		? null
		: typeof entry.parentId === "string" ? entry.parentId : undefined;
	if (parentId === undefined) return null;
	const timestamp = entry.timestamp === undefined || entry.timestamp === null
		? null
		: typeof entry.timestamp === "string" ? entry.timestamp : undefined;
	if (timestamp === undefined) return null;
	return { id: entry.id, parentId, type: entry.type, timestamp };
}

function hubDetails(entry: unknown): Record<string, unknown> | null {
	if (!isObject(entry) || entry.type !== "message" || !isObject(entry.message)) return null;
	const message = entry.message;
	if (message.role !== "toolResult" || message.toolName !== "hub" || !isObject(message.details)) return null;
	return message.details;
}

function terminalJobStatus(value: unknown): RuntimeJobStatus | null {
	return value === "completed" || value === "failed" || value === "cancelled" ? value : null;
}

function jobResolutionsFromEntry(
	entry: unknown,
	entryId: string,
	branch: RuntimeBranchState,
	sessionKey: string,
): RuntimeJobResolution[] {
	const details = hubDetails(entry);
	if (!details) return [];
	const facts: RuntimeJobResolution[] = [];
	if (Array.isArray(details.jobs)) {
		for (const job of details.jobs) {
			if (!isObject(job) || typeof job.id !== "string" || !job.id) continue;
			const status = terminalJobStatus(job.status);
			if (!status) continue;
			facts.push({
				id: assuranceId("runtime-job-resolution", sessionKey, entryId, job.id, status),
				jobId: job.id,
				status,
				branch,
				entryId,
			});
		}
	}
	if (Array.isArray(details.cancelled)) {
		for (const outcome of details.cancelled) {
			if (!isObject(outcome) || typeof outcome.id !== "string" || !outcome.id || outcome.status !== "cancelled") continue;
			facts.push({
				id: assuranceId("runtime-job-resolution", sessionKey, entryId, outcome.id, "cancelled"),
				jobId: outcome.id,
				status: "cancelled",
				branch,
				entryId,
			});
		}
	}
	return facts;
}

function availableRuntimeRead<Entry>(
	read: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
): read is Extract<typeof read, { status: "available" }> {
	return read.status === "available" && read.consistency !== "source-changed";
}

export function runtimeSourceCoverage<Entry>(
	read: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
	sourceId: string,
): SourceCoverage {
	const sessionKey = read.status === "available"
		? sessionKeyOf(read.data as RuntimeEntrySnapshot<unknown>)
		: assuranceId("runtime-source", sourceId);
	const reason = read.status === "unavailable"
		? read.reason
		: read.consistency === "source-changed" ? "source-changed" : undefined;
	return {
		sourceId,
		sessionKey,
		scope: { ...read.scope },
		availability: read.status,
		consistency: read.consistency,
		startedAt: read.startedAt,
		finishedAt: read.finishedAt,
		assessed: reason === undefined,
		...(reason ? { reason } : {}),
		...(read.status === "unavailable" && read.httpStatus !== undefined ? { httpStatus: read.httpStatus } : {}),
		limitations: [...read.limitations],
	};
}

/**
 * Project public runtime entries into bounded retained-tree and coordination facts.
 * Raw message content, tool arguments/results and paths stay out of the report.
 */
export function deriveRuntimeEvidence<Entry>(
	read: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
	activeRead?: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
): RuntimeEvidence | undefined {
	if (!availableRuntimeRead(read)) return undefined;
	const retainedTree = read.scope.source === "omp-runtime" && read.scope.view === "all-retained-entries";
	let activeIds: Set<string>;
	if (!retainedTree) {
		activeIds = new Set(read.data.entries.flatMap(entry => {
			const identity = entryIdentity(entry);
			return identity ? [identity.id] : [];
		}));
	} else {
		if (!activeRead || !availableRuntimeRead(activeRead) ||
			activeRead.data.sessionId !== read.data.sessionId ||
			activeRead.data.sessionFile !== read.data.sessionFile ||
			activeRead.data.leafId !== read.data.leafId) return undefined;
		activeIds = new Set(activeRead.data.entries.flatMap(entry => {
			const identity = entryIdentity(entry);
			return identity ? [identity.id] : [];
		}));
	}

	const sessionKey = sessionKeyOf(read.data as RuntimeEntrySnapshot<unknown>);
	const entries: RuntimeTreeEntry[] = [];
	const resolutions: RuntimeJobResolution[] = [];
	const limitations = new Set<RuntimeEvidenceLimitation>([
		"main-session-only",
		"child-retained-history-unavailable",
		"not-an-atomic-snapshot",
	]);

	for (const entry of read.data.entries) {
		const identity = entryIdentity(entry);
		if (!identity) {
			limitations.add("invalid-retained-entry-shape");
			continue;
		}
		const branch: RuntimeBranchState = activeIds.has(identity.id) ? "active" : "off-branch";
		entries.push({ ...identity, branch });
		resolutions.push(...jobResolutionsFromEntry(entry, identity.id, branch, sessionKey));
	}

	return {
		sessionKey,
		leafId: read.data.leafId,
		retainedTree,
		entries: entries.sort((a, b) => a.timestamp === b.timestamp ? a.id.localeCompare(b.id) :
			(a.timestamp ?? "").localeCompare(b.timestamp ?? "") || a.id.localeCompare(b.id)),
		jobResolutions: [...new Map(resolutions.map(item => [item.id, item])).values()].sort(compareIds),
		limitations: [...limitations].sort(),
	};
}
