import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import { isObject, isSessionSummary, isSessionTrace } from "./omp-stats-contract";
import type { EvidenceRead, ReadLimit, ReadScope } from "./read-result";

export type StatsFetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Consumers depend only on needed reads, not the CLI or server ownership. */
export interface SessionTraceReader {
	getTrace(file: string, signal?: AbortSignal): Promise<EvidenceRead<SessionTrace>>;
}
export interface SessionEntryReader {
	getEntry(file: string, id: string, signal?: AbortSignal): Promise<EvidenceRead<{ entry: unknown }>>;
}
export interface OmpStatsClient extends SessionTraceReader, SessionEntryReader {
	sync(signal?: AbortSignal): Promise<EvidenceRead<unknown>>;
	listSessions(limit: number, signal?: AbortSignal): Promise<EvidenceRead<SessionSummary[]>>;
}

/** Inert, caller-selected LOCAL access. Raw successful payloads remain private. */
export function createOmpStatsClient(
	origin: string,
	fetcher: StatsFetch = (url, init) => fetch(url, init),
	now: () => number = Date.now,
): OmpStatsClient {
	let base: URL;
	try {
		base = new URL(origin);
	} catch {
		throw new Error("Expected a loopback HTTP origin without credentials or a path");
	}
	if (base.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) ||
		base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
		throw new Error("Expected a loopback HTTP origin without credentials or a path");
	}

	async function read<T>(
		view: Extract<ReadScope, { source: "omp-stats" }>["view"],
		path: string,
		accept: (value: unknown) => boolean,
		limitations: readonly ReadLimit[],
		signal?: AbortSignal,
	): Promise<EvidenceRead<T>> {
		const scope: ReadScope = { source: "omp-stats", view };
		const startedAt = now();
		const metadata = () => ({ scope, startedAt, finishedAt: now(), limitations, consistency: "not-checked" as const });
		if (signal?.aborted) return { ...metadata(), status: "unavailable", reason: "aborted" };
		let response: Response;
		try {
			response = await fetcher(new URL(path, base).href, { signal, redirect: "error" });
		} catch {
			return { ...metadata(), status: "unavailable", reason: signal?.aborted ? "aborted" : "transport" };
		}
		if (!response.ok) {
			// Never read potentially private HTTP diagnostic bodies.
			try { await response.body?.cancel(); } catch { /* Best-effort release. */ }
			return { ...metadata(), status: "unavailable", reason: signal?.aborted ? "aborted" : "http", httpStatus: response.status };
		}
		let data: unknown;
		try {
			data = await response.json();
		} catch {
			return { ...metadata(), status: "unavailable", reason: signal?.aborted ? "aborted" : "invalid-json" };
		}
		if (signal?.aborted) return { ...metadata(), status: "unavailable", reason: "aborted" };
		if (!accept(data)) return { ...metadata(), status: "unavailable", reason: "invalid-envelope" };
		return { ...metadata(), status: "available", data: data as T };
	}

	return {
		sync: signal => read("sync", "/api/sync", () => true, [], signal),
		async listSessions(limit, signal) {
			if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error("Expected a positive session limit");
			const result = await read<SessionSummary[]>("session-list", `/api/sessions?limit=${limit}`,
				value => Array.isArray(value) && value.every(isSessionSummary), ["bounded-session-list"], signal);
			if (result.status === "available" && result.data.length >= limit) {
				return { ...result, limitations: [...result.limitations, "list-limit-reached" as const] };
			}
			return result;
		},
		getTrace(file, signal) {
			return read("active-branch-trace", `/api/session/trace?file=${encodeURIComponent(file)}`,
				value => isSessionTrace(value) && value.file === file,
				["active-branches-only", "child-completeness-unknown", "details-are-previews", "not-an-atomic-snapshot"], signal);
		},
		getEntry(file, id, signal) {
			return read("selected-entry", `/api/session/entry?file=${encodeURIComponent(file)}&id=${encodeURIComponent(id)}`,
				value => isObject(value) && isObject(value.entry) && value.entry.id === id, [], signal);
		},
	};
}

export interface LocalStatsServer {
	hostname: string;
	port: number;
	stop(): unknown;
}
export interface LocalStatsOptions {
	start?: () => Promise<LocalStatsServer>;
	fetch?: StatsFetch;
	now?: () => number;
	startLogsToStderr?: boolean;
}

async function startOwnedServer(start: () => Promise<LocalStatsServer>, logsToStderr: boolean): Promise<LocalStatsServer> {
	if (!logsToStderr) return start();
	const originalLog = console.log;
	console.log = (...args: unknown[]) => console.error(...args);
	try {
		return await start();
	} finally {
		console.log = originalLog;
	}
}

/** Own only this server; release it on success, read failure or consumer failure. */
export async function withLocalOmpStats<T>(
	use: (client: OmpStatsClient) => Promise<T>,
	options: LocalStatsOptions = {},
): Promise<T> {
	const start = options.start ?? (async () => {
		const { startServer } = await import("@oh-my-pi/omp-stats");
		return startServer(0, "127.0.0.1");
	});
	const server = await startOwnedServer(start, options.startLogsToStderr ?? false);
	try {
		return await use(createOmpStatsClient(`http://${server.hostname}:${server.port}`, options.fetch, options.now));
	} finally {
		await server.stop();
	}
}
