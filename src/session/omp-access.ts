import type { ReadonlySessionManager, SessionEntry } from "@oh-my-pi/pi-coding-agent";
import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";

export type ReadScope = "session-list" | "persisted-active-branches" | "entry" | "current-branch" | "retained-entries";
export type ReadLimit =
	| "bounded-session-list"
	| "list-limit-reached"
	| "active-branches-only"
	| "child-completeness-unknown"
	| "details-are-previews"
	| "single-session-only"
	| "retained-entries-only"
	| "not-an-atomic-snapshot";

interface ReadWindow {
	scope: ReadScope;
	startedAt: number;
	finishedAt: number;
	limitations: ReadLimit[];
}

export interface ReadProblem {
	operation: "sync" | ReadScope;
	code: "transport" | "http" | "invalid-payload" | "runtime" | "changed-during-read";
	httpStatus?: number;
}

/** Status describes evidence availability, never tool success or absence of effects. */
export type SessionRead<T> = ReadWindow & (
	| { status: "available" | "partial"; data: T }
	| { status: "unavailable"; problem: ReadProblem }
);

/** Intentionally excludes URLs, paths, response bodies and exception text. */
export class OmpReadError extends Error {
	readonly problem: ReadProblem;
	constructor(problem: ReadProblem) {
		super(`OMP ${problem.operation}: ${problem.code}${problem.httpStatus === undefined ? "" : ` (HTTP ${problem.httpStatus})`}`);
		this.name = "OmpReadError";
		this.problem = problem;
	}
}

/** Legacy quantitative callers may consume partial scopes; review callers must retain coverage. */
export function requireRead<T>(result: SessionRead<T>): T {
	if (result.status === "unavailable") throw new OmpReadError(result.problem);
	return result.data;
}

type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);
const textOrNull = (value: unknown): boolean => value === null || typeof value === "string";
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const numbers = (value: JsonObject, keys: string[]): boolean => keys.every(key => number(value[key]));
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === "string");
const optional = (value: JsonObject, keys: string[], check: (item: unknown) => boolean): boolean =>
	keys.every(key => value[key] === undefined || check(value[key]));
const isString = (value: unknown): boolean => typeof value === "string";
const isBoolean = (value: unknown): boolean => typeof value === "boolean";

function isSummary(value: unknown): value is SessionSummary {
	return object(value) && typeof value.file === "string" && typeof value.folder === "string" &&
		textOrNull(value.title) && strings(value.models) &&
		numbers(value, ["startedAt", "endedAt", "requests", "toolCalls", "subagents", "totalTokens", "costTotal", "unpricedRequests"]);
}

/** Check consumed fields, not a second implementation of OMP's journal schema. */
function isTrace(value: unknown): value is SessionTrace {
	if (!object(value) || typeof value.file !== "string" || !textOrNull(value.cwd) || !textOrNull(value.title) ||
		!numbers(value, ["startedAt", "endedAt", "mtimeMs"]) || !Array.isArray(value.tracks) || !object(value.summary)) return false;
	const summary = value.summary;
	if (!numbers(summary, ["wallMs", "modelMs", "toolMs", "idleMs", "turns", "requests", "toolCalls", "subagents", "totalTokens", "costTotal", "unpricedRequests"]) ||
		!Array.isArray(summary.toolStats) || !summary.toolStats.every(stat => object(stat) && typeof stat.tool === "string" &&
			numbers(stat, ["calls", "errors", "totalMs", "maxMs"]))) return false;
	return value.tracks.every(track => object(track) && typeof track.id === "string" && textOrNull(track.parentId) &&
		typeof track.file === "string" && typeof track.label === "string" && textOrNull(track.agent) && textOrNull(track.model) &&
		Array.isArray(track.markers) && track.markers.every(marker => object(marker) && number(marker.time) &&
			typeof marker.kind === "string" && typeof marker.label === "string") &&
		Array.isArray(track.spans) && track.spans.every(span => object(span) && typeof span.id === "string" &&
			["turn", "model", "tool", "subagent", "background"].includes(String(span.kind)) &&
			numbers(span, ["start", "end"]) && (span.end as number) >= (span.start as number) && typeof span.label === "string" &&
			optional(span, ["detail", "entryId", "toolCallId", "model", "childTrackId"], isString) &&
			optional(span, ["isError", "unterminated"], isBoolean) && optional(span, ["tokens", "cost", "ttft"], number)));
}

export type StatsFetch = (url: string, init?: RequestInit) => Promise<Response>;
interface ClientOptions {
	fetch?: StatsFetch;
	now?: () => number;
}

export interface OmpStatsClient {
	sync(signal?: AbortSignal): Promise<void>;
	listSessions(limit: number, signal?: AbortSignal): Promise<SessionRead<SessionSummary[]>>;
	getTrace(file: string, signal?: AbortSignal): Promise<SessionRead<SessionTrace>>;
	getEntry(file: string, id: string, signal?: AbortSignal): Promise<SessionRead<{ entry: JsonObject }>>;
}

/** Construction performs no I/O. Only use an explicitly selected local OMP stats server. */
export function createOmpStatsClient(origin: string, options: ClientOptions = {}): OmpStatsClient {
	const base = new URL(origin);
	if (base.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) ||
		base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
		throw new Error("OMP stats requires a loopback HTTP origin without credentials or a path");
	}
	const request = options.fetch ?? ((url, init) => fetch(url, init));
	const now = options.now ?? Date.now;

	async function json(operation: ReadProblem["operation"], path: string, signal?: AbortSignal): Promise<unknown> {
		let response: Response;
		try {
			response = await request(`${base.origin}${path}`, { signal, redirect: "error" });
		} catch {
			throw new OmpReadError({ operation, code: "transport" });
		}
		if (!response.ok) {
			// Do not read or retain server diagnostics: they can contain private payloads.
			await response.body?.cancel().catch(() => {});
			throw new OmpReadError({ operation, code: "http", httpStatus: response.status });
		}
		try {
			return await response.json();
		} catch {
			throw new OmpReadError({ operation, code: "invalid-payload" });
		}
	}

	async function read<T>(scope: ReadScope, path: string, validate: (value: unknown) => value is T,
		limitations: ReadLimit[], signal?: AbortSignal): Promise<SessionRead<T>> {
		const startedAt = now();
		try {
			const data = await json(scope, path, signal);
			if (!validate(data)) throw new OmpReadError({ operation: scope, code: "invalid-payload" });
			return { status: limitations.length ? "partial" : "available", scope, startedAt, finishedAt: now(), limitations, data };
		} catch (error) {
			return { status: "unavailable", scope, startedAt, finishedAt: now(), limitations,
				problem: error instanceof OmpReadError ? error.problem : { operation: scope, code: "invalid-payload" } };
		}
	}

	return {
		async sync(signal) { await json("sync", "/api/sync", signal); },
		async listSessions(limit, signal) {
			if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error("Session limit must be a positive safe integer");
			const result = await read("session-list", `/api/sessions?limit=${limit}`,
				(value): value is SessionSummary[] => Array.isArray(value) && value.every(isSummary), ["bounded-session-list"], signal);
			if (result.status !== "unavailable" && result.data.length >= limit) {
				return { ...result, status: "partial", limitations: [...result.limitations, "list-limit-reached"] };
			}
			return result;
		},
		getTrace(file, signal) {
			return read("persisted-active-branches", `/api/session/trace?file=${encodeURIComponent(file)}`,
				(value): value is SessionTrace => isTrace(value) && value.file === file,
				["active-branches-only", "child-completeness-unknown", "details-are-previews", "not-an-atomic-snapshot"], signal);
		},
		getEntry(file, id, signal) {
			return read("entry", `/api/session/entry?file=${encodeURIComponent(file)}&id=${encodeURIComponent(id)}`,
				(value): value is { entry: JsonObject } => object(value) && object(value.entry) && value.entry.id === id, [], signal);
		},
	};
}

interface StatsServer {
	hostname: string;
	port: number;
	stop(): void | Promise<void>;
}
export interface OwnedStatsOptions extends ClientOptions {
	startServer?: (port: number, hostname: string) => Promise<StatsServer>;
}

/** Own only the server created for this operation. No daemon or automatic sync. */
export async function withOmpStats<T>(run: (client: OmpStatsClient) => Promise<T>, options: OwnedStatsOptions = {}): Promise<T> {
	const start = options.startServer ?? (async (port, hostname) => {
		const { startServer } = await import("@oh-my-pi/omp-stats");
		return startServer(port, hostname);
	});
	const server = await start(0, "127.0.0.1");
	try {
		return await run(createOmpStatsClient(`http://${server.hostname}:${server.port}`, options));
	} finally {
		await server.stop();
	}
}

export type CurrentSessionSource = Pick<ReadonlySessionManager,
	"getSessionId" | "getSessionFile" | "getLeafId" | "getBranch" | "getEntries">;
export interface CurrentSessionSnapshot {
	sessionId: string;
	sessionFile: string | undefined;
	leafId: string | null;
	entries: SessionEntry[];
}

/** Public in-process access, not a raw journal parser. Returned contents remain private. */
export function readCurrentSession(source: CurrentSessionSource, scope: "current-branch" | "retained-entries",
	now: () => number = Date.now): SessionRead<CurrentSessionSnapshot> {
	const startedAt = now();
	const limitations: ReadLimit[] = ["single-session-only", "retained-entries-only"];
	if (scope === "current-branch") limitations.push("active-branches-only");
	try {
		const sessionId = source.getSessionId();
		const sessionFile = source.getSessionFile();
		const leafId = source.getLeafId();
		const entries = structuredClone(scope === "current-branch" ? source.getBranch(leafId) : source.getEntries());
		if (sessionId !== source.getSessionId() || sessionFile !== source.getSessionFile() || leafId !== source.getLeafId()) {
			throw new OmpReadError({ operation: scope, code: "changed-during-read" });
		}
		return { status: "partial", scope, startedAt, finishedAt: now(), limitations, data: { sessionId, sessionFile, leafId, entries } };
	} catch (error) {
		return { status: "unavailable", scope, startedAt, finishedAt: now(), limitations,
			problem: error instanceof OmpReadError ? error.problem : { operation: scope, code: "runtime" } };
	}
}
