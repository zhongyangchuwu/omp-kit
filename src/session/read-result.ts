/** Availability describes a requested view, never exhaustive real-world coverage. */
export type ReadScope =
	| { source: "omp-stats"; view: "session-list" | "active-branch-trace" | "selected-entry" | "sync" }
	| { source: "omp-runtime"; view: "active-branch-entries" | "all-retained-entries" };

export type ReadFailureReason =
	| "http"
	| "transport"
	| "invalid-json"
	| "invalid-envelope"
	| "aborted"
	| "runtime-unavailable"
	| "runtime-read-failed";

export type EvidenceRead<T> = { scope: ReadScope } & (
	| { status: "available"; data: T }
	| { status: "partial"; data: T; reason: "source-changed" }
	| { status: "unavailable"; reason: ReadFailureReason; httpStatus?: number }
);

/** Diagnostics deliberately omit source paths, response bodies and raw exception text. */
export class EvidenceReadError extends Error {
	constructor(
		readonly scope: ReadScope,
		readonly status: "partial" | "unavailable",
		readonly reason: string,
		readonly httpStatus?: number,
	) {
		super(`Evidence read ${scope.source}/${scope.view}: ${status} (${reason}${httpStatus === undefined ? "" : ` ${httpStatus}`})`);
		this.name = "EvidenceReadError";
	}
}

/** Strict consumers fail closed; partial-report consumers inspect the union instead. */
export function requireEvidence<T>(read: EvidenceRead<T>): T {
	if (read.status === "available") return read.data;
	throw new EvidenceReadError(read.scope, read.status, read.reason, read.status === "unavailable" ? read.httpStatus : undefined);
}
