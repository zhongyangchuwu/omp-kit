import { createHash } from "node:crypto";
import type { ReadConsistency, ReadFailureReason, ReadLimit, ReadScope } from "../session/read-result";
import type { ActionFacts, OperationType, ResourceKind, ScopeBoundary } from "./scope/model";

export const ASSURANCE_SCHEMA = "omp-kit.session-assurance/v2" as const;

/** Local correlation only. Hashes and native identifiers are NOT anonymization. */
export function assuranceId(...parts: string[]): string {
	return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

export interface EvidenceRef {
	readonly sourceId: string;
	readonly sessionKey: string;
	readonly trackId: string;
	readonly spanId: string;
	readonly entryId?: string;
	readonly toolCallId?: string;
}

export interface ActionSample {
	readonly toolName: string;
	readonly terminal: "observed" | "missing";
	readonly errorReported: boolean;
	readonly evidence: EvidenceRef;
}

export interface ActionObservation {
	readonly id: string;
	readonly kind: "tool" | "background";
	readonly samples: readonly ActionSample[];
}

export interface SourceCoverage {
	readonly sourceId: string;
	readonly sessionKey: string;
	readonly scope: ReadScope;
	readonly availability: "available" | "unavailable";
	readonly consistency: ReadConsistency;
	readonly startedAt: number;
	readonly finishedAt: number;
	readonly assessed: boolean;
	readonly httpStatus?: number;
	readonly reason?: ReadFailureReason | "unexpected-view" | "invalid-trace";
	readonly limitations: readonly ReadLimit[];
}

export type RuntimeBranchState = "active" | "off-branch";
export type RuntimeJobStatus = "completed" | "failed" | "cancelled";

export interface RuntimeTreeEntry {
	readonly id: string;
	readonly parentId: string | null;
	readonly type: string;
	readonly timestamp: string | null;
	readonly branch: RuntimeBranchState;
}

export interface RuntimeJobResolution {
	readonly id: string;
	readonly jobId: string;
	readonly status: RuntimeJobStatus;
	readonly branch: RuntimeBranchState;
	readonly entryId: string;
}

export interface RuntimeToolAction {
	readonly id: string;
	readonly entryId: string;
	readonly toolCallId: string;
	readonly toolName: string;
	readonly branch: RuntimeBranchState;
	readonly terminal: "observed" | "missing";
	readonly errorReported: boolean;
	readonly factStatus: "classified" | "unclassified" | "not-assessed";
	readonly boundaries: readonly ScopeBoundary[];
	readonly operations: readonly OperationType[];
	readonly resources: readonly ResourceKind[];
}

export type RuntimeEvidenceLimitation =
	| "main-session-only"
	| "child-retained-history-unavailable"
	| "not-an-atomic-snapshot"
	| "invalid-retained-entry-shape"
	| "retained-action-facts-declared-targets-only"
	| "retained-workspace-root-unverified"
	| "retained-generic-shell-unclassified";

export interface RuntimeEvidence {
	readonly sessionKey: string;
	readonly leafId: string | null;
	readonly retainedTree: boolean;
	readonly entries: readonly RuntimeTreeEntry[];
	readonly toolActions: readonly RuntimeToolAction[];
	readonly jobResolutions: readonly RuntimeJobResolution[];
	readonly limitations: readonly RuntimeEvidenceLimitation[];
}

export interface AssuranceInput {
	readonly actions: readonly ActionObservation[];
	readonly coverage: readonly SourceCoverage[];
	/** Optional independent boundary / operation / resource facts from structured tool contracts. */
	readonly actionFacts?: ActionFacts;
	/** Optional public-runtime fact surface. Raw messages/tool payloads are not copied here. */
	readonly runtime?: RuntimeEvidence;
}

export interface RulePresentation {
	readonly section: "attention" | "evidence" | "coverage";
	readonly summaryLabel?: string;
}

/** Rule-owned metadata. Engines and renderers must not hard-code concrete rule IDs. */
export interface AssuranceRuleMeta {
	readonly id: string;
	readonly version: number;
	readonly title: string;
	readonly description: string;
	readonly messages: Readonly<Record<string, string>>;
	readonly presentation: RulePresentation;
}

/** A rule reports local findings only; the engine attaches global identity and provenance. */
export interface RuleFinding {
	readonly kind: string;
	readonly subjectId: string;
	readonly code: string;
	readonly evidence: readonly EvidenceRef[];
}

export interface Finding extends RuleFinding {
	readonly id: string;
	readonly ruleId: string;
	readonly ruleVersion: number;
}

export interface RuleEvaluation {
	readonly status: "evaluated" | "partial" | "skipped";
	readonly findings: readonly RuleFinding[];
}

export interface RuleResult {
	readonly ruleId: string;
	readonly ruleVersion: number;
	readonly presentation: RulePresentation;
	readonly status: RuleEvaluation["status"] | "failed";
	readonly failure?: "exception" | "invalid-output";
	readonly findings: readonly Finding[];
}

/** Rules receive immutable observations, never a reader, shell, database or mutable report. */
export interface AssuranceRule {
	readonly meta: AssuranceRuleMeta;
	evaluate(input: AssuranceInput): RuleEvaluation;
}

export interface AssuranceReport extends AssuranceInput {
	readonly schemaVersion: typeof ASSURANCE_SCHEMA;
	readonly rules: readonly RuleResult[];
	readonly findings: readonly Finding[];
}

export const compareIds = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
