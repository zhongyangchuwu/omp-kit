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
	type RuntimeToolAction,
	type RuntimeToolScope,
	type RuntimeTreeEntry,
	type SourceCoverage,
} from "./model";
import type { ScopeToolCall } from "./scope/model";
import { BUILTIN_SCOPE_CLASSIFIERS } from "./scope/registry";

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

interface RuntimeToolResultSummary {
	terminal: boolean;
	errorReported: boolean;
}

function toolResultSummaries(entries: readonly unknown[]): Map<string, RuntimeToolResultSummary> {
	const byCall = new Map<string, RuntimeToolResultSummary>();
	for (const entry of entries) {
		if (!isObject(entry) || entry.type !== "message" || !isObject(entry.message)) continue;
		const message = entry.message;
		if (message.role !== "toolResult" || typeof message.toolCallId !== "string" || !message.toolCallId) continue;
		const existing = byCall.get(message.toolCallId);
		byCall.set(message.toolCallId, {
			terminal: true,
			errorReported: existing?.errorReported === true || message.isError === true,
		});
	}
	return byCall;
}

function dedupeScopes(scopes: readonly RuntimeToolScope[]): RuntimeToolScope[] {
	const byKey = new Map<string, RuntimeToolScope>();
	for (const scope of scopes) byKey.set(`${scope.boundary}\u0000${scope.access}\u0000${scope.resource}`, scope);
	return [...byKey.values()].sort((a, b) => {
		const left = `${a.boundary}\u0000${a.access}\u0000${a.resource}`;
		const right = `${b.boundary}\u0000${b.access}\u0000${b.resource}`;
		return left.localeCompare(right);
	});
}

function classifyRuntimeTool(
	actionId: string,
	position: number,
	toolName: string,
	argumentsValue: unknown,
	options: { workspaceRoot?: string | null; homeDir?: string | null; classifyTools?: boolean },
): { status: RuntimeToolAction["scopeStatus"]; scopes: RuntimeToolScope[] } {
	if (!options.classifyTools) return { status: "not-assessed", scopes: [] };
	if (!isObject(argumentsValue)) return { status: "unclassified", scopes: [] };
	const call: ScopeToolCall = {
		actionId,
		trackKey: assuranceId("runtime-main-track", actionId),
		position,
		toolName,
		arguments: argumentsValue,
		evidence: [],
	};
	const scopes: RuntimeToolScope[] = [];
	try {
		for (const classifier of BUILTIN_SCOPE_CLASSIFIERS) {
			const result = classifier.classify(call, {
				workspaceRoot: options.workspaceRoot ?? null,
				homeDir: options.homeDir ?? null,
			});
			if (result === "not-applicable") continue;
			scopes.push(...result.map(item => ({
				boundary: item.boundary,
				access: item.access,
				resource: item.resource,
			})));
		}
	} catch {
		return { status: "unclassified", scopes: [] };
	}
	const deduped = dedupeScopes(scopes);
	return { status: deduped.length ? "classified" : "unclassified", scopes: deduped };
}

function toolActionsFromEntries(
	entries: readonly unknown[],
	activeIds: ReadonlySet<string>,
	sessionKey: string,
	options: { workspaceRoot?: string | null; homeDir?: string | null; classifyTools?: boolean },
): RuntimeToolAction[] {
	const results = toolResultSummaries(entries);
	const actions: RuntimeToolAction[] = [];
	let position = 0;
	for (const entry of entries) {
		const identity = entryIdentity(entry);
		if (!identity || !isObject(entry) || entry.type !== "message" || !isObject(entry.message)) continue;
		const message = entry.message;
		if (message.role !== "assistant" || !Array.isArray(message.content)) continue;
		for (const block of message.content) {
			if (!isObject(block) || block.type !== "toolCall" ||
				typeof block.id !== "string" || !block.id ||
				typeof block.name !== "string" || !block.name) continue;
			const actionId = assuranceId("runtime-main-tool", sessionKey, identity.id, block.id);
			const result = results.get(block.id);
			const classification = classifyRuntimeTool(actionId, position++, block.name, block.arguments, options);
			actions.push({
				id: actionId,
				entryId: identity.id,
				toolCallId: block.id,
				toolName: block.name,
				branch: activeIds.has(identity.id) ? "active" : "off-branch",
				terminal: result?.terminal ? "observed" : "missing",
				errorReported: result?.errorReported === true,
				scopeStatus: classification.status,
				scopes: classification.scopes,
			});
		}
	}
	return actions.sort(compareIds);
}

function availableRuntimeRead<Entry>(
	read: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
): read is Extract<EvidenceRead<RuntimeEntrySnapshot<Entry>>, { status: "available" }> {
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
 * Project public runtime entries into bounded retained-tree, tool and coordination facts.
 * Raw message text, tool arguments/results and paths stay out of the report.
 */
export function deriveRuntimeEvidence<Entry>(
	read: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
	activeRead?: EvidenceRead<RuntimeEntrySnapshot<Entry>>,
	options: {
		readonly classifyTools?: boolean;
		readonly workspaceRoot?: string | null;
		readonly homeDir?: string | null;
	} = {},
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
	if (options.classifyTools) {
		limitations.add("retained-tool-scope-declared-targets-only");
		limitations.add("retained-generic-shell-unclassified");
	}

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
		toolActions: toolActionsFromEntries(read.data.entries, activeIds, sessionKey, options),
		jobResolutions: [...new Map(resolutions.map(item => [item.id, item])).values()].sort(compareIds),
		limitations: [...limitations].sort(),
	};
}
