import { createHash } from "node:crypto";
import type { ReadConsistency, ReadFailureReason, ReadLimit, ReadScope } from "../session/read-result";

export const ASSURANCE_SCHEMA = "omp-kit.session-assurance/v1" as const;

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

export interface AssuranceInput {
	readonly actions: readonly ActionObservation[];
	readonly coverage: readonly SourceCoverage[];
}

export type FindingKind = "tool-error" | "terminal-missing" | "coverage-gap";
export interface Finding {
	readonly id: string;
	readonly kind: FindingKind;
	readonly ruleId: string;
	readonly ruleVersion: number;
	readonly subjectId: string;
	readonly code: string;
	readonly evidence: readonly EvidenceRef[];
}

export interface RuleResult {
	readonly ruleId: string;
	readonly ruleVersion: number;
	readonly status: "evaluated" | "partial" | "skipped" | "failed";
	readonly findings: readonly Finding[];
}

/** Rules receive data, never a reader, shell, database or mutable shared report. */
export interface AssuranceRule {
	readonly id: string;
	readonly version: number;
	evaluate(input: AssuranceInput): Pick<RuleResult, "status" | "findings">;
}

export interface AssuranceReport extends AssuranceInput {
	readonly schemaVersion: typeof ASSURANCE_SCHEMA;
	readonly rules: readonly RuleResult[];
	readonly findings: readonly Finding[];
}

export const compareIds = (a: { id: string }, b: { id: string }): number => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
