import type { EvidenceRead, ReadLimit, ReadScope } from "./read-result";

/** Narrow structural subset of the public SDK, without importing its runtime. */
export interface RuntimeEntrySource<Entry> {
	getSessionId(): string;
	getSessionFile(): string | undefined;
	getLeafId(): string | null;
	getBranch(leafId?: string): Entry[];
	getEntries(): Entry[];
}
export interface RuntimeEntrySnapshot<Entry> {
	sessionId: string;
	sessionFile: string | null;
	leafId: string | null;
	entries: readonly Entry[];
}

type RuntimeView = Extract<ReadScope, { source: "omp-runtime" }>["view"];

/** Detached PRIVATE view of ONE live session; no child recursion or journal parsing. */
export function readRuntimeEntries<Entry>(
	source: RuntimeEntrySource<Entry> | null | undefined,
	view: RuntimeView = "active-branch-entries",
	now: () => number = Date.now,
): EvidenceRead<RuntimeEntrySnapshot<Entry>> {
	const scope: ReadScope = { source: "omp-runtime", view };
	const startedAt = now();
	const limitations: ReadLimit[] = ["single-session-only", "retained-entries-only", "not-an-atomic-snapshot"];
	if (view === "active-branch-entries") limitations.push("active-branches-only");
	const metadata = () => ({ scope, startedAt, finishedAt: now(), limitations, consistency: "not-checked" as const });
	if (!source) return { ...metadata(), status: "unavailable", reason: "runtime-unavailable" };
	try {
		const sessionId = source.getSessionId();
		const sessionFile = source.getSessionFile() ?? null;
		const leafId = source.getLeafId();
		const entries = structuredClone(view === "all-retained-entries"
			? source.getEntries()
			: leafId === null ? [] : source.getBranch(leafId));
		// Never attach possibly mixed data to an identity that changed mid-read.
		if (source.getSessionId() !== sessionId || (source.getSessionFile() ?? null) !== sessionFile) {
			return { ...metadata(), consistency: "source-changed", status: "unavailable", reason: "source-changed" };
		}
		const consistency = source.getLeafId() === leafId ? "no-change-detected" : "source-changed";
		return { ...metadata(), consistency, status: "available", data: { sessionId, sessionFile, leafId, entries } };
	} catch {
		return { ...metadata(), status: "unavailable", reason: "runtime-read-failed" };
	}
}
