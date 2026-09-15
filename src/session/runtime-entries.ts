import type { EvidenceRead, ReadScope } from "./read-result";

/** Narrow structural subset of OMP's public sessionManager; no raw journal parser. */
export interface RuntimeEntrySource<Entry> {
	getSessionId(): string;
	getSessionFile(): string | undefined;
	getLeafId(): string | null;
	getBranch(leafId?: string | null): Entry[];
	getEntries(): Entry[];
}

export interface RuntimeEntrySnapshot<Entry> {
	sessionId: string;
	sessionFile: string | null;
	leafId: string | null;
	entries: readonly Entry[];
}

type RuntimeView = Extract<ReadScope, { source: "omp-runtime" }>["view"];

/**
 * A detached snapshot of ONE live session's retained entries. Other branches require
 * explicit all-retained selection; child sessions and erased history are not implied.
 * Raw entries stay private and must not be forwarded to a publication sink by default.
 */
export function readRuntimeEntries<Entry>(
	source: RuntimeEntrySource<Entry> | null | undefined,
	view: RuntimeView = "active-branch-entries",
): EvidenceRead<RuntimeEntrySnapshot<Entry>> {
	const scope: ReadScope = { source: "omp-runtime", view };
	if (!source) return { scope, status: "unavailable", reason: "runtime-unavailable" };
	try {
		const sessionId = source.getSessionId();
		const sessionFile = source.getSessionFile() ?? null;
		const leafId = source.getLeafId();
		const entries = structuredClone(view === "all-retained-entries" ? source.getEntries() : source.getBranch(leafId));
		const data = { sessionId, sessionFile, leafId, entries };
		if (source.getSessionId() !== sessionId || (source.getSessionFile() ?? null) !== sessionFile || source.getLeafId() !== leafId) {
			return { scope, status: "partial", reason: "source-changed", data };
		}
		return { scope, status: "available", data };
	} catch {
		return { scope, status: "unavailable", reason: "runtime-read-failed" };
	}
}
