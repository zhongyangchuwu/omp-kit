/** A scope names the requested view, not all real-world execution. */
export type ReadScope =
	| { source: "omp-stats"; view: "session-list" | "active-branch-trace" | "selected-entry" | "sync" }
	| { source: "omp-runtime"; view: "active-branch-entries" | "all-retained-entries" };

export type ReadLimit =
	| "bounded-session-list"
	| "list-limit-reached"
	| "active-branches-only"
	| "child-completeness-unknown"
	| "details-are-previews"
	| "single-session-only"
	| "retained-entries-only"
	| "not-an-atomic-snapshot";

export type ReadConsistency = "not-checked" | "no-change-detected" | "source-changed";
export type ReadFailureReason =
	| "http"
	| "transport"
	| "invalid-json"
	| "invalid-envelope"
	| "aborted"
	| "runtime-unavailable"
	| "runtime-read-failed"
	| "source-changed";

interface ReadMetadata {
	scope: ReadScope;
	startedAt: number;
	finishedAt: number;
	limitations: readonly ReadLimit[];
	consistency: ReadConsistency;
}

/** Availability, coverage and consistency are independent; none is a success verdict. */
export type EvidenceRead<T> = ReadMetadata & (
	| { status: "available"; data: T }
	| { status: "unavailable"; reason: ReadFailureReason; httpStatus?: number }
);

/** Deliberately excludes paths, response bodies and raw exception text. */
export class EvidenceReadError extends Error {
	constructor(
		readonly scope: ReadScope,
		readonly reason: ReadFailureReason,
		readonly httpStatus?: number,
	) {
		super(`Evidence read ${scope.source}/${scope.view}: ${reason}${httpStatus === undefined ? "" : ` (HTTP ${httpStatus})`}`);
		this.name = "EvidenceReadError";
	}
}

/** Accept the requested bounded view, but reject failed reads and detected movement. */
export function requireEvidence<T>(read: EvidenceRead<T>): T {
	if (read.status === "unavailable") throw new EvidenceReadError(read.scope, read.reason, read.httpStatus);
	if (read.consistency === "source-changed") throw new EvidenceReadError(read.scope, "source-changed");
	return read.data;
}
