import type { EvidenceRef } from "../model";

export type ScopeBoundary = "workspace" | "host-user" | "host-system" | "external" | "unknown";
export type ScopeAccess = "read" | "write" | "execute" | "unknown";
export type ScopeResource =
	| "filesystem"
	| "process"
	| "configuration"
	| "package"
	| "version-control"
	| "service"
	| "network"
	| "unknown";

export interface ScopeClassifierRef {
	readonly id: string;
	readonly version: number;
}

/** Deterministic scope fact derived from one observed tool action. */
export interface ScopeObservation {
	readonly id: string;
	readonly actionId: string;
	readonly trackId: string;
	/** Tool-order position within one trace track. No cross-track causal order is implied. */
	readonly position: number;
	readonly boundary: ScopeBoundary;
	readonly access: ScopeAccess;
	readonly resource: ScopeResource;
	readonly classifier: ScopeClassifierRef;
	readonly evidence: readonly EvidenceRef[];
}

export type ScopeCoverageReason =
	| "entry-reader-unavailable"
	| "tool-input-unavailable"
	| "tool-input-not-found"
	| "invalid-tool-input"
	| "unsupported-tool";

/** Classification status for one tool action, separate from raw trace-read coverage. */
export interface ScopeActionCoverage {
	readonly actionId: string;
	readonly trackId: string;
	readonly position: number;
	readonly status: "classified" | "unclassified";
	readonly reason?: ScopeCoverageReason;
	readonly evidence: readonly EvidenceRef[];
}

export type ScopeLimitation =
	| "declared-targets-only"
	| "generic-shell-unclassified"
	| "path-symlink-target-unverified"
	| "cross-track-order-unavailable";

export interface ScopeEvidence {
	/** Whether the supplied trace sources needed for scope derivation were readable. */
	readonly traceCoverage: "available" | "partial" | "unavailable";
	readonly observations: readonly ScopeObservation[];
	readonly actionCoverage: readonly ScopeActionCoverage[];
	readonly limitations: readonly ScopeLimitation[];
}

export interface ScopeToolCall {
	readonly actionId: string;
	readonly trackId: string;
	readonly position: number;
	readonly toolName: string;
	readonly arguments: Readonly<Record<string, unknown>>;
	readonly evidence: readonly EvidenceRef[];
}

export interface ScopeClassifierContext {
	/** Root session cwd. Relative paths are still the current track workspace. */
	readonly workspaceRoot: string | null;
	readonly homeDir: string | null;
}

export interface ScopeDescriptor {
	readonly boundary: ScopeBoundary;
	readonly access: ScopeAccess;
	readonly resource: ScopeResource;
}

export interface ScopeClassifier {
	readonly meta: ScopeClassifierRef;
	classify(call: ScopeToolCall, context: ScopeClassifierContext): readonly ScopeDescriptor[] | "not-applicable";
}
