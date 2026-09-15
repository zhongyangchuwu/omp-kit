import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import type { EvidenceRead, ReadScope } from "./read-result";

export type StatsFetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Consumers depend on only the reads they use, not on server ownership or a CLI. */
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

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Borrow an already selected stats server. Construction performs no IO, sync or logging.
 * Envelope checks are not a replacement for per-field validation in semantic rules.
 * Returned OMP data is private; it is not an allowlisted publication format.
 */
export function createOmpStatsClient(
	origin: string,
	fetcher: StatsFetch = (url, init) => fetch(url, init),
): OmpStatsClient {
	const base = new URL(origin);
	if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
		throw new Error("Expected an HTTP stats origin without embedded credentials");
	}

	async function read<T>(
		view: Extract<ReadScope, { source: "omp-stats" }>["view"],
		path: string,
		accept: (value: unknown) => boolean,
		signal?: AbortSignal,
	): Promise<EvidenceRead<T>> {
		const scope: ReadScope = { source: "omp-stats", view };
		if (signal?.aborted) return { scope, status: "unavailable", reason: "aborted" };
		let response: Response;
		try {
			response = await fetcher(new URL(path, base).href, { signal });
		} catch {
			return { scope, status: "unavailable", reason: signal?.aborted ? "aborted" : "transport" };
		}
		if (!response.ok) {
			// Do not read or retain potentially private diagnostic bodies.
			try { await response.body?.cancel(); } catch { /* Best-effort body release. */ }
			return { scope, status: "unavailable", reason: "http", httpStatus: response.status };
		}
		let data: unknown;
		try {
			data = await response.json();
		} catch {
			return { scope, status: "unavailable", reason: signal?.aborted ? "aborted" : "invalid-json" };
		}
		if (signal?.aborted) return { scope, status: "unavailable", reason: "aborted" };
		if (!accept(data)) return { scope, status: "unavailable", reason: "invalid-envelope" };
		return { scope, status: "available", data: data as T };
	}

	return {
		sync: signal => read("sync", "/api/sync", () => true, signal),
		listSessions(limit, signal) {
			if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error("Expected a positive session limit");
			return read(
				"session-list",
				`/api/sessions?limit=${limit}`,
				value => Array.isArray(value) && value.every(row => isObject(row) && typeof row.file === "string"),
				signal,
			);
		},
		getTrace(file, signal) {
			return read(
				"active-branch-trace",
				`/api/session/trace?file=${encodeURIComponent(file)}`,
				value => isObject(value) && value.file === file && Array.isArray(value.tracks) && isObject(value.summary),
				signal,
			);
		},
		getEntry(file, id, signal) {
			return read(
				"selected-entry",
				`/api/session/entry?file=${encodeURIComponent(file)}&id=${encodeURIComponent(id)}`,
				value => isObject(value) && isObject(value.entry),
				signal,
			);
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
}

/** Own only the server created here; release it on callback success or failure. */
export async function withLocalOmpStats<T>(
	use: (client: OmpStatsClient) => Promise<T>,
	options: LocalStatsOptions = {},
): Promise<T> {
	const start = options.start ?? (async () => {
		const { startServer } = await import("@oh-my-pi/omp-stats");
		return startServer(0, "127.0.0.1");
	});
	const server = await start();
	try {
		const client = createOmpStatsClient(`http://${server.hostname}:${server.port}`, options.fetch);
		return await use(client);
	} finally {
		await server.stop();
	}
}
