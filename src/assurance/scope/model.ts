import type { EvidenceRef } from "../model";

export type ScopeBoundary = "workspace" | "host-user" | "host-system" | "external" | "unknown";
export type OperationType = "read" | "write" | "execute" | "unknown";
export type ResourceKind =
	| "filesystem"
	| "process"
	| "configuration"
	| "package"
	| "version-control"
	| "service"
	| "network"
	| "unknown";

export interface ActionClassifierRef {
	readonly id: string;
	readonly version: number;
}

interface ActionFactObservation {
	readonly id: string;
	readonly actionId: string;
	/** Opaque correlation for facts projected from the same classifier descriptor. */
	readonly groupId: string;
	/** Stable private correlation key for one transcript; native track ids remain in evidence refs. */
	readonly trackKey: string;
	/** Tool-order position within one transcript. No cross-track causal order is implied. */
	readonly position: number;
	readonly classifier: ActionClassifierRef;
	readonly evidence: readonly EvidenceRef[];
}

/** Where an observed action was directed. Carries no operation or resource judgment. */
export interface BoundaryObservation extends ActionFactObservation {
	readonly boundary: ScopeBoundary;
}

/** What kind of operation the tool contract exposes. Carries no boundary judgment. */
export interface OperationObservation extends ActionFactObservation {
	readonly operation: OperationType;
}

/** What kind of resource the tool contract addresses. Carries no boundary or operation judgment. */
export interface ResourceObservation extends ActionFactObservation {
	readonly resource: ResourceKind;
}

export type ActionFactCoverageReason =
	| "entry-reader-unavailable"
	| "tool-input-unavailable"
	| "tool-input-not-found"
	| "invalid-tool-input"
	| "unsupported-tool";

/** Classification status for one tool action, shared by the independent fact dimensions. */
export interface ActionFactCoverage {
	readonly actionId: string;
	readonly trackKey: string;
	readonly position: number;
	readonly status: "classified" | "unclassified";
	readonly reason?: ActionFactCoverageReason;
	readonly evidence: readonly EvidenceRef[];
}

export type ActionFactLimitation =
	| "declared-targets-only"
	| "generic-shell-unclassified"
	| "path-symlink-target-unverified"
	| "child-workspace-root-unverified"
	| "cross-track-order-unavailable";

/**
 * Independent observed action facts derived by one bounded structured-tool pass.
 * Coverage is shared because boundary/operation/resource come from the same tool-contract classification.
 */
export interface ActionFacts {
	readonly traceCoverage: "available" | "partial" | "unavailable";
	readonly boundaries: readonly BoundaryObservation[];
	readonly operations: readonly OperationObservation[];
	readonly resources: readonly ResourceObservation[];
	readonly actionCoverage: readonly ActionFactCoverage[];
	readonly limitations: readonly ActionFactLimitation[];
}

export interface ActionToolCall {
	readonly actionId: string;
	readonly trackKey: string;
	readonly position: number;
	readonly toolName: string;
	readonly arguments: Readonly<Record<string, unknown>>;
	readonly evidence: readonly EvidenceRef[];
}

export interface ActionClassifierContext {
	/** Known workspace root for this transcript, or null when the public trace does not expose it. */
	readonly workspaceRoot: string | null;
	readonly homeDir: string | null;
}

/**
 * Internal classifier product. It is immediately projected into independent
 * boundary / operation / resource facts; rules do not consume this tuple directly.
 */
export interface ActionDescriptor {
	readonly boundary: ScopeBoundary;
	readonly operation: OperationType;
	readonly resource: ResourceKind;
}

export interface ActionClassifier {
	readonly meta: ActionClassifierRef;
	classify(call: ActionToolCall, context: ActionClassifierContext): readonly ActionDescriptor[] | "not-applicable";
}
