import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";

type JsonObject = Record<string, unknown>;
export const isObject = (value: unknown): value is JsonObject =>
	value !== null && typeof value === "object" && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const textOrNull = (value: unknown): boolean => value === null || isString(value);
const numbers = (value: JsonObject, keys: readonly string[]): boolean => keys.every(key => isNumber(value[key]));
const optional = (value: JsonObject, keys: readonly string[], check: (item: unknown) => boolean): boolean =>
	keys.every(key => value[key] === undefined || check(value[key]));

export function isSessionSummary(value: unknown): value is SessionSummary {
	return isObject(value) && isString(value.file) && isString(value.folder) && textOrNull(value.title) &&
		Array.isArray(value.models) && value.models.every(isString) &&
		numbers(value, ["startedAt", "endedAt", "requests", "toolCalls", "subagents", "totalTokens", "costTotal", "unpricedRequests"]);
}

/** Validate consumed public fields, not raw journal internals; retain additive fields. */
export function isSessionTrace(value: unknown): value is SessionTrace {
	if (!isObject(value) || !isString(value.file) || !isString(value.etag) || !textOrNull(value.cwd) || !textOrNull(value.title) ||
		!numbers(value, ["startedAt", "endedAt", "mtimeMs"]) || !Array.isArray(value.tracks) || !isObject(value.summary)) return false;
	const summary = value.summary;
	if (!numbers(summary, ["wallMs", "modelMs", "toolMs", "idleMs", "turns", "requests", "toolCalls", "subagents", "totalTokens", "costTotal", "unpricedRequests"]) ||
		!Array.isArray(summary.toolStats) || !summary.toolStats.every(stat => isObject(stat) && isString(stat.tool) &&
			numbers(stat, ["calls", "errors", "totalMs", "maxMs"]))) return false;
	return value.tracks.every(track => isObject(track) && isString(track.id) && textOrNull(track.parentId) &&
		isString(track.file) && isString(track.label) && textOrNull(track.agent) && textOrNull(track.model) &&
		Array.isArray(track.markers) && track.markers.every(marker => isObject(marker) && isNumber(marker.time) &&
			isString(marker.kind) && isString(marker.label)) &&
		Array.isArray(track.spans) && track.spans.every(span => isObject(span) && isString(span.id) &&
			isString(span.kind) && ["turn", "model", "tool", "subagent", "background"].includes(span.kind) &&
			isNumber(span.start) && isNumber(span.end) && span.end >= span.start && isString(span.label) &&
			optional(span, ["detail", "entryId", "toolCallId", "model", "childTrackId"], isString) &&
			optional(span, ["isError", "unterminated"], isBoolean) && optional(span, ["tokens", "cost", "ttft"], isNumber)));
}
