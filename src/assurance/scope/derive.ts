import type { TraceSpan, TraceTrack } from "@oh-my-pi/omp-stats/shared-types";
import type { SessionEntryReader } from "../../session/omp-stats";
import { assuranceId, compareIds, type AssuranceInput, type EvidenceRef } from "../model";
import { traceActionId, traceEvidenceRef, traceInputIsAssessed, type TraceInput } from "../trace-observations";
import type {
	ScopeActionCoverage,
	ScopeClassifier,
	ScopeDescriptor,
	ScopeEvidence,
	ScopeObservation,
	ScopeToolCall,
} from "./model";

const CLASSIFIER_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
const BOUNDARIES = new Set(["workspace", "host-user", "host-system", "external", "unknown"]);
const ACCESS = new Set(["read", "write", "execute", "unknown"]);
const RESOURCES = new Set(["filesystem", "process", "configuration", "package", "version-control", "service", "network", "unknown"]);
const MAX_ENTRY_HOPS = 8;

interface ToolCandidate {
	actionId: string;
	trackId: string;
	position: number;
	toolName: string;
	trackFile: string;
	entryId?: string;
	toolCallId?: string;
	workspaceRoot: string | null;
	evidence: EvidenceRef[];
}

interface RecoveredToolCall {
	toolName: string;
	arguments: Record<string, unknown>;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateClassifiers(classifiers: readonly ScopeClassifier[]): void {
	const ids = new Set<string>();
	for (const classifier of classifiers) {
		if (!CLASSIFIER_ID.test(classifier.meta.id) || ids.has(classifier.meta.id) ||
			!Number.isSafeInteger(classifier.meta.version) || classifier.meta.version < 1 || typeof classifier.classify !== "function") {
			throw new Error("Invalid or duplicate scope classifier definition");
		}
		ids.add(classifier.meta.id);
	}
}

function validDescriptor(value: ScopeDescriptor): boolean {
	return BOUNDARIES.has(value.boundary) && ACCESS.has(value.access) && RESOURCES.has(value.resource);
}

function toolCallFromEntry(entry: unknown, toolCallId: string): RecoveredToolCall | "invalid" | null {
	if (!isObject(entry) || entry.type !== "message" || !isObject(entry.message)) return null;
	const message = entry.message;
	if (message.role !== "assistant" || !Array.isArray(message.content)) return null;
	for (const block of message.content) {
		if (!isObject(block) || block.type !== "toolCall" || block.id !== toolCallId) continue;
		if (typeof block.name !== "string" || !isObject(block.arguments)) return "invalid";
		return { toolName: block.name, arguments: block.arguments };
	}
	return null;
}

function parentId(entry: unknown): string | null {
	return isObject(entry) && typeof entry.parentId === "string" && entry.parentId ? entry.parentId : null;
}

async function recoverToolCall(
	reader: SessionEntryReader,
	file: string,
	entryId: string,
	toolCallId: string,
	signal: AbortSignal | undefined,
	cache: Map<string, ReturnType<SessionEntryReader["getEntry"]>>,
): Promise<RecoveredToolCall | "unavailable" | "not-found" | "invalid"> {
	let current: string | null = entryId;
	const seen = new Set<string>();
	for (let hop = 0; hop < MAX_ENTRY_HOPS && current; hop++) {
		if (seen.has(current)) return "not-found";
		seen.add(current);
		const key = `${file}\u0000${current}`;
		let pending = cache.get(key);
		if (!pending) {
			pending = reader.getEntry(file, current, signal);
			cache.set(key, pending);
		}
		const read = await pending;
		if (read.status !== "available") return "unavailable";
		const found = toolCallFromEntry(read.data.entry, toolCallId);
		if (found === "invalid") return "invalid";
		if (found) return found;
		current = parentId(read.data.entry);
	}
	return "not-found";
}

function candidateForSpan(input: TraceInput, track: TraceTrack, span: TraceSpan, position: number): ToolCandidate {
	const sessionKey = assuranceId("session-file", input.sessionFile);
	return {
		actionId: traceActionId(input.sourceId, track, span),
		trackId: track.id,
		position,
		toolName: span.label,
		trackFile: track.file,
		workspaceRoot: input.read.status === "available" ? input.read.data.cwd ?? null : null,
		...(span.entryId ? { entryId: span.entryId } : {}),
		...(span.toolCallId ? { toolCallId: span.toolCallId } : {}),
		evidence: [traceEvidenceRef(input.sourceId, sessionKey, track, span)],
	};
}

function collectCandidates(inputs: readonly TraceInput[], normalized: AssuranceInput): ToolCandidate[] {
	const knownActions = new Set(normalized.actions.filter(action => action.kind === "tool").map(action => action.id));
	const byAction = new Map<string, ToolCandidate>();
	for (const input of inputs) {
		if (!traceInputIsAssessed(input) || input.read.status !== "available") continue;
		for (const track of input.read.data.tracks) {
			let position = 0;
			for (const span of track.spans) {
				if (span.kind !== "tool") continue;
				const candidate = candidateForSpan(input, track, span, position++);
				if (!knownActions.has(candidate.actionId)) continue;
				const existing = byAction.get(candidate.actionId);
				if (!existing) {
					byAction.set(candidate.actionId, candidate);
					continue;
				}
				const evidence = [...existing.evidence, ...candidate.evidence]
					.filter((ref, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(ref)) === index);
				byAction.set(candidate.actionId, { ...existing, position: Math.min(existing.position, candidate.position), evidence });
			}
		}
	}
	return [...byAction.values()].sort((a, b) => a.trackId < b.trackId ? -1 : a.trackId > b.trackId ? 1 : a.position - b.position || a.actionId.localeCompare(b.actionId));
}

function coverage(candidate: ToolCandidate, status: ScopeActionCoverage["status"], reason?: ScopeActionCoverage["reason"]): ScopeActionCoverage {
	return {
		actionId: candidate.actionId,
		trackId: candidate.trackId,
		position: candidate.position,
		status,
		...(reason ? { reason } : {}),
		evidence: structuredClone(candidate.evidence),
	};
}

/**
 * Enrich normalized trace observations with bounded scope facts. Raw tool arguments are read and classified in memory only.
 * Classifiers receive no IO capability and may only return bounded descriptors.
 */
export async function deriveTraceScopeEvidence(
	inputs: readonly TraceInput[],
	normalized: AssuranceInput,
	reader: SessionEntryReader | undefined,
	classifiers: readonly ScopeClassifier[],
	options: { readonly homeDir?: string | null; readonly signal?: AbortSignal } = {},
): Promise<ScopeEvidence> {
	validateClassifiers(classifiers);
	const candidates = collectCandidates(inputs, normalized);
	const observations: ScopeObservation[] = [];
	const actionCoverage: ScopeActionCoverage[] = [];
	const entryCache = new Map<string, ReturnType<SessionEntryReader["getEntry"]>>();
	for (const candidate of candidates) {
		if (!reader) {
			actionCoverage.push(coverage(candidate, "unclassified", "entry-reader-unavailable"));
			continue;
		}
		if (!candidate.entryId || !candidate.toolCallId) {
			actionCoverage.push(coverage(candidate, "unclassified", "tool-input-not-found"));
			continue;
		}
		const recovered = await recoverToolCall(reader, candidate.trackFile, candidate.entryId, candidate.toolCallId, options.signal, entryCache);
		if (recovered === "unavailable") {
			actionCoverage.push(coverage(candidate, "unclassified", "tool-input-unavailable"));
			continue;
		}
		if (recovered === "not-found") {
			actionCoverage.push(coverage(candidate, "unclassified", "tool-input-not-found"));
			continue;
		}
		if (recovered === "invalid") {
			actionCoverage.push(coverage(candidate, "unclassified", "invalid-tool-input"));
			continue;
		}
		const call: ScopeToolCall = {
			actionId: candidate.actionId,
			trackId: candidate.trackId,
			position: candidate.position,
			toolName: recovered.toolName,
			arguments: recovered.arguments,
			evidence: candidate.evidence,
		};
		let matched = false;
		for (const classifier of classifiers) {
			const result = classifier.classify(call, { workspaceRoot: candidate.workspaceRoot, homeDir: options.homeDir ?? null });
			if (result === "not-applicable") continue;
			if (!Array.isArray(result) || result.length === 0 || result.some(value => !validDescriptor(value))) {
				throw new Error("Invalid scope classifier output");
			}
			matched = true;
			for (const descriptor of result) {
				observations.push({
					id: assuranceId("scope", candidate.actionId, classifier.meta.id, String(classifier.meta.version), descriptor.boundary, descriptor.access, descriptor.resource),
					actionId: candidate.actionId,
					trackId: candidate.trackId,
					position: candidate.position,
					...descriptor,
					classifier: { ...classifier.meta },
					evidence: structuredClone(candidate.evidence),
				});
			}
		}
		actionCoverage.push(coverage(candidate, matched ? "classified" : "unclassified", matched ? undefined : "unsupported-tool"));
	}
	const deduped = [...new Map(observations.map(value => [value.id, value])).values()].sort(compareIds);
	return {
		observations: deduped,
		actionCoverage: actionCoverage.sort((a, b) => a.trackId < b.trackId ? -1 : a.trackId > b.trackId ? 1 : a.position - b.position || a.actionId.localeCompare(b.actionId)),
		limitations: ["declared-targets-only", "generic-shell-unclassified", "path-symlink-target-unverified", "cross-track-order-unavailable"],
	};
}
