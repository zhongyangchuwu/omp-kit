import { expect, test } from "bun:test";
import type { SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import { feedbackForTrace } from "../../scripts/session_evidence";

const trace: SessionTrace = {
	file: "/sessions/root.jsonl",
	title: null,
	cwd: "/work/project",
	startedAt: 0,
	endedAt: 1,
	mtimeMs: 1, etag: "test-etag",
	tracks: [
		{
			id: "main",
			parentId: null,
			label: "Main",
			agent: "main",
			model: null,
			file: "/sessions/root.jsonl",
			spans: [],
			markers: [],
		},
		{
			id: "Worker1",
			parentId: "main",
			label: "Worker1",
			agent: "luna-code",
			model: null,
			file: "/sessions/root/Worker1.jsonl",
			spans: [],
			markers: [],
		},
	],
	summary: {
		wallMs: 1,
		modelMs: 0,
		toolMs: 0,
		idleMs: 1,
		turns: 0,
		requests: 0,
		toolCalls: 0,
		subagents: 1,
		totalTokens: 0,
		costTotal: 0,
		unpricedRequests: 0,
		toolStats: [],
	},
};

test("root session evidence includes feedback from child transcript provenance", () => {
	const bySessionFile = new Map([
		["/sessions/root.jsonl", [{ id: "main-finding", category: "overhead", severity: "low" }]],
		["/sessions/root/Worker1.jsonl", [{ id: "worker-finding", category: "delegation", severity: "medium" }]],
	]);

	expect(feedbackForTrace(trace, bySessionFile)).toEqual([
		{ id: "main-finding", category: "overhead", severity: "low" },
		{ id: "worker-finding", category: "delegation", severity: "medium" },
	]);
});
