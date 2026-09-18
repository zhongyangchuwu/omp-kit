import { describe, expect, test } from "bun:test";
import type { SessionSummary, SessionTrace } from "@oh-my-pi/omp-stats/shared-types";
import {
	agentTypeForTrack,
	buildAggregateReport,
	buildSessionEvidence,
	envelopeOverlapMs,
	folderFilterMatches,
	parseCli,
	sessionKey,
	sessionRevision,
} from "../../scripts/session_evidence";

const summary: SessionSummary = {
	file: "/sessions/project/root.jsonl",
	folder: "/work/project",
	title: "Implement feature",
	startedAt: 1_000,
	endedAt: 11_000,
	requests: 3,
	toolCalls: 2,
	subagents: 1,
	totalTokens: 600,
	costTotal: 0.06,
	unpricedRequests: 0,
	models: ["gpt-main", "gpt-worker"],
};

const trace: SessionTrace = {
	file: summary.file,
	title: summary.title,
	cwd: summary.folder,
	startedAt: 1_000,
	endedAt: 11_000,
	mtimeMs: 12_000, etag: "test-etag",
	tracks: [
		{
			id: "main",
			parentId: null,
			label: "Main",
			agent: "main",
			model: "gpt-main",
			file: summary.file,
			spans: [
				{
					id: "main:m1",
					kind: "model",
					start: 1_000,
					end: 2_000,
					label: "gpt-main",
					entryId: "m1",
					model: "gpt-main",
					tokens: 200,
					cost: 0.02,
					ttft: 120,
				},
				{
					id: "main:t1",
					kind: "tool",
					start: 2_000,
					end: 2_500,
					label: "read",
					entryId: "t1",
				},
				{
					id: "main:m2",
					kind: "model",
					start: 2_500,
					end: 3_500,
					label: "gpt-main",
					entryId: "m2",
					model: "gpt-main",
					tokens: 150,
					cost: 0.015,
					ttft: 100,
				},
			],
			markers: [],
		},
		{
			id: "Worker1",
			parentId: "main",
			label: "Worker1",
			agent: "luna-code",
			model: "gpt-worker",
			file: "/sessions/project/root/Worker1.jsonl",
			spans: [
				{
					id: "Worker1:m1",
					kind: "model",
					start: 4_000,
					end: 6_000,
					label: "gpt-worker",
					entryId: "wm1",
					model: "gpt-worker",
					tokens: 250,
					cost: 0.025,
					ttft: 80,
				},
				{
					id: "Worker1:t1",
					kind: "tool",
					start: 6_000,
					end: 7_000,
					label: "grep",
					entryId: "wt1",
					isError: true,
				},
			],
			markers: [],
		},
	],
	summary: {
		wallMs: 10_000,
		modelMs: 2_000,
		toolMs: 500,
		idleMs: 5_500,
		turns: 3,
		requests: 3,
		toolCalls: 2,
		subagents: 1,
		totalTokens: 600,
		costTotal: 0.06,
		unpricedRequests: 0,
		toolStats: [
			{ tool: "read", calls: 1, errors: 0, totalMs: 500, maxMs: 500 },
			{ tool: "grep", calls: 1, errors: 1, totalMs: 1_000, maxMs: 1_000 },
		],
	},
};

describe("session identity and overlap", () => {
	test("uses stable file identity and meaningful revision fields", () => {
		expect(sessionKey(summary.file)).toHaveLength(32);
		expect(sessionKey(summary.file)).toBe(sessionKey(summary.file));
		expect(sessionRevision(summary)).toBe("11000:3:2:1:600");
	});

	test("classifies main, advisor, and task tracks", () => {
		expect(agentTypeForTrack(trace.tracks[0])).toBe("main");
		expect(agentTypeForTrack({ ...trace.tracks[1], id: "Worker1/__advisor" })).toBe("advisor");
		expect(agentTypeForTrack(trace.tracks[1])).toBe("subagent");
	});

	test("measures concurrent child-track envelope time without counting sequential time", () => {
		expect(envelopeOverlapMs([[0, 10], [5, 15], [20, 30]])).toBe(5);
		expect(envelopeOverlapMs([[0, 5], [5, 10]])).toBe(0);
	});
});

test("matches a normal project path when OMP summary folder is a storage key", () => {
	expect(folderFilterMatches("/home/han/project/omp-kit", "-project-omp-kit", "/home/han/project/omp-kit")).toBe(true);
	expect(folderFilterMatches("-project-omp-kit", "-project-omp-kit", "/home/han/project/omp-kit")).toBe(true);
	expect(folderFilterMatches("/home/han/other", "-project-omp-kit", "/home/han/project/omp-kit")).toBe(false);
});

test("buildSessionEvidence joins trace, provider samples, and feedback", async () => {
	const evidence = await buildSessionEvidence(
		summary,
		trace,
		[{ id: "feedback-1", category: "delegation", severity: "medium" }],
		async (_file, span) => (span.model === "gpt-worker" ? "worker-provider" : "main-provider"),
	);

	expect(evidence.source.file).toBe(summary.file);
	expect(evidence.session.folder).toBe("/work/project");
	expect(evidence.session.cwd).toBe("/work/project");
	expect(evidence.session.requests).toBe(3);
	expect(evidence.delegation.mainRequests).toBe(2);
	expect(evidence.delegation.subagentRequests).toBe(1);
	expect(evidence.delegation.subagentTracks).toBe(1);
	expect(evidence.tracks.find(track => track.id === "Worker1")?.toolErrors).toBe(1);
	expect(evidence.modelCalls).toEqual([
		{
			model: "gpt-main",
			provider: "main-provider",
			requests: 2,
			errors: 0,
			tokens: 350,
			costTotal: 0.035,
			totalMs: 2_000,
			avgTtftMs: 110,
		},
		{
			model: "gpt-worker",
			provider: "worker-provider",
			requests: 1,
			errors: 0,
			tokens: 250,
			costTotal: 0.025,
			totalMs: 2_000,
			avgTtftMs: 80,
		},
	]);
	expect(evidence.feedback.links).toEqual([{ id: "feedback-1", category: "delegation", severity: "medium" }]);
});

test("normalizes an encoded OMP summary folder to the public trace cwd", async () => {
	const encodedSummary = { ...summary, folder: "-project-omp-kit" };
	const actualCwd = "/home/han/project/omp-kit";
	const encodedTrace = { ...trace, cwd: actualCwd };
	const evidence = await buildSessionEvidence(encodedSummary, encodedTrace, []);

	expect(evidence.session.folder).toBe(actualCwd);
	expect(evidence.session.cwd).toBe(actualCwd);
	expect(buildAggregateReport([evidence], { folder: actualCwd }).sessions).toBe(1);
});

test("aggregate report separates agent/model/tool evidence from qualitative feedback", async () => {
	const evidence = await buildSessionEvidence(
		summary,
		trace,
		[{ id: "feedback-1", category: "delegation", severity: "medium" }],
		async (_file, span) => (span.model === "gpt-worker" ? "worker-provider" : "main-provider"),
	);
	const report = buildAggregateReport([evidence], { folder: "/work" });

	expect(report.sessions).toBe(1);
	expect(report.totals.requests).toBe(3);
	expect(report.byAgentType.main.requests).toBe(2);
	expect(report.byAgentType.subagent.requests).toBe(1);
	expect(report.models.map(model => [model.provider, model.model, model.requests])).toEqual([
		["main-provider", "gpt-main", 2],
		["worker-provider", "gpt-worker", 1],
	]);
	expect(report.tools.map(tool => [tool.tool, tool.calls, tool.errors])).toEqual([
		["grep", 1, 1],
		["read", 1, 0],
	]);
	expect(report.feedbackCategories).toEqual({ delegation: 1 });
});

test("CLI parsing supports incremental collection filters without requiring experiment metadata", () => {
	const options = parseCli([
		"collect",
		"--root",
		"/tmp/evidence",
		"--folder=/work/project",
		"--since",
		"2026-09-01T00:00:00Z",
		"--limit",
		"250",
		"--json",
	]);
	expect(options.command).toBe("collect");
	expect(options.root).toBe("/tmp/evidence");
	expect(options.folder).toBe("/work/project");
	expect(options.since).toBe(Date.parse("2026-09-01T00:00:00Z"));
	expect(options.limit).toBe(250);
	expect(options.json).toBe(true);
});
