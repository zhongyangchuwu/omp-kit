import { afterAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
const previousOmpProfile = process.env.OMP_PROFILE;
const previousPiProfile = process.env.PI_PROFILE;
const isolatedAgentDir = await mkdtemp(join(tmpdir(), "omp-kit-feedback-agent-"));
delete process.env.OMP_PROFILE;
delete process.env.PI_PROFILE;
process.env.PI_CODING_AGENT_DIR = isolatedAgentDir;

// The extension resolves getAgentDir during module loading; dynamic imports keep this test's
// official agent-dir target isolated from the user's profile while preserving that behavior.
const piSdk = await import("@oh-my-pi/pi-coding-agent");
const feedback = await import("../../extensions/feedback");
const { zod, getAgentDir } = piSdk;
const {
	FEEDBACK_CATEGORIES,
	FEEDBACK_SEVERITIES,
	MAX_SUMMARY_LENGTH,
	MAX_EVIDENCE_LENGTH,
	MAX_SUGGESTED_DIRECTION_LENGTH,
	appendFeedbackRecord,
	buildFeedbackRecord,
	createFeedbackSchema,
	feedbackContextFromRuntime,
} = feedback;

const validInput = {
	category: "delegation" as const,
	severity: "medium" as const,
	summary: "A worker needed repository context that was not available at activation time.",
	evidence: "The delegated task spent time reconstructing the project boundary before useful work began.",
	suggestedDirection: "Make the relevant context handoff explicit before delegation starts.",
};

const feedbackSchema = createFeedbackSchema(zod);

type RuntimeContext = {
	cwd: string;
	sessionManager: {
		getSessionId?: () => string;
		getSessionFile?: () => string | undefined;
	};
};

type RegisteredTool = {
	name: string;
	approval: string;
	description: string;
	parameters: {
		safeParse(value: unknown): {
			success: boolean;
			data?: unknown;
			error?: unknown;
		};
	};
	execute(
		toolCallId: string,
		params: unknown,
		signal: unknown,
		onUpdate: unknown,
		context: RuntimeContext,
	): Promise<unknown>;
};

type AppendEvent = { type: string; record: unknown };

type FakePi = {
	zod: typeof zod;
	logger: {
		warn(...args: unknown[]): void;
		error(...args: unknown[]): void;
	};
	registerTool(definition: unknown): void;
	appendEntry(type: string, record: unknown): Promise<void>;
};

type FeedbackHarness = {
	pi: FakePi;
	tools: RegisteredTool[];
	appendEvents: AppendEvent[];
	warnings: unknown[][];
	errors: unknown[][];
};

function makePi(onAppendEntry?: (type: string, record: unknown) => void | Promise<void>): FeedbackHarness {
	const tools: RegisteredTool[] = [];
	const appendEvents: AppendEvent[] = [];
	const warnings: unknown[][] = [];
	const errors: unknown[][] = [];
	const pi: FakePi = {
		zod,
		logger: {
			warn(...args) {
				warnings.push(args);
			},
			error(...args) {
				errors.push(args);
			},
		},
		registerTool(definition) {
			tools.push(definition as RegisteredTool);
		},
		async appendEntry(type, record) {
			appendEvents.push({ type, record });
			await onAppendEntry?.(type, record);
		},
	};
	return { pi, tools, appendEvents, warnings, errors };
}

function registerFeedbackTool(
	onAppendEntry?: (type: string, record: unknown) => void | Promise<void>,
): FeedbackHarness & { tool: RegisteredTool } {
	const registered = makePi(onAppendEntry);
	const register = feedback.default as unknown as (pi: unknown) => void;
	register(registered.pi);
	expect(registered.tools).toHaveLength(1);
	return { ...registered, tool: registered.tools[0] };
}

function feedbackPath(): string {
	return join(getAgentDir(), "omp-kit", "feedback.jsonl");
}

function detailsFrom(result: unknown): unknown {
	if (typeof result !== "object" || result === null || !("details" in result)) {
		throw new Error("feedback tool result did not expose record details");
	}
	return result.details;
}

function idFrom(record: unknown): string {
	if (typeof record !== "object" || record === null || !("id" in record) || typeof record.id !== "string") {
		throw new Error("feedback record did not expose a string id");
	}
	return record.id;
}

async function invokeTool(
	tool: RegisteredTool,
	cwd = isolatedAgentDir,
	sessionId = "feedback-test-session",
	sessionFile: string | undefined = join(isolatedAgentDir, "sessions", "feedback-test.jsonl"),
): Promise<unknown> {
	return tool.execute("feedback-test-call", validInput, undefined, undefined, {
		cwd,
		sessionManager: {
			getSessionId: () => sessionId,
			getSessionFile: () => sessionFile,
		},
	});
}

afterAll(async () => {
	await rm(isolatedAgentDir, { recursive: true, force: true });
	if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
	else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
	if (previousOmpProfile === undefined) delete process.env.OMP_PROFILE;
	else process.env.OMP_PROFILE = previousOmpProfile;
	if (previousPiProfile === undefined) delete process.env.PI_PROFILE;
	else process.env.PI_PROFILE = previousPiProfile;
});

describe("feedback schema", () => {
	test("accepts a valid feedback input and rejects unknown fields", () => {
		const parsed = feedbackSchema.safeParse(validInput);
		expect(parsed.success).toBe(true);
		if (parsed.success) expect(parsed.data).toEqual(validInput);

		const unknownField = feedbackSchema.safeParse({ ...validInput, unexpected: true });
		expect(unknownField.success).toBe(false);
	});

	test("accepts only the published categories", () => {
		for (const category of FEEDBACK_CATEGORIES) {
			expect(feedbackSchema.safeParse({ ...validInput, category }).success).toBe(true);
		}
		expect(feedbackSchema.safeParse({ ...validInput, category: "not-a-feedback-category" }).success).toBe(false);
	});

	test("accepts only the published severities", () => {
		for (const severity of FEEDBACK_SEVERITIES) {
			expect(feedbackSchema.safeParse({ ...validInput, severity }).success).toBe(true);
		}
		expect(feedbackSchema.safeParse({ ...validInput, severity: "urgent" }).success).toBe(false);
	});

	test("requires non-empty bounded summary, evidence, and suggested direction", () => {
		const boundedFields = [
			["summary", MAX_SUMMARY_LENGTH],
			["evidence", MAX_EVIDENCE_LENGTH],
			["suggestedDirection", MAX_SUGGESTED_DIRECTION_LENGTH],
		] as const;

		for (const [field, maxLength] of boundedFields) {
			expect(feedbackSchema.safeParse({ ...validInput, [field]: "" }).success).toBe(false);
			expect(feedbackSchema.safeParse({ ...validInput, [field]: "x".repeat(maxLength) }).success).toBe(true);
			expect(feedbackSchema.safeParse({ ...validInput, [field]: "x".repeat(maxLength + 1) }).success).toBe(false);
		}
	});
});

test("buildFeedbackRecord adds durable metadata and session provenance", () => {
	const record = buildFeedbackRecord(validInput, {
		cwd: "/workspace/project",
		sessionId: "session-123",
		sessionFile: "/sessions/session-123.jsonl",
	});

	expect(record.schemaVersion).toBe(1);
	expect(record.cwd).toBe("/workspace/project");
	expect(record.sessionId).toBe("session-123");
	expect(record.sessionFile).toBe("/sessions/session-123.jsonl");
	expect(record.category).toBe(validInput.category);
	expect(record.severity).toBe(validInput.severity);
	expect(record.summary).toBe(validInput.summary);
	expect(record.evidence).toBe(validInput.evidence);
	expect(record.suggestedDirection).toBe(validInput.suggestedDirection);
	expect(record.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	expect(Number.isNaN(Date.parse(record.timestamp))).toBe(false);
});

test("feedbackContextFromRuntime uses public session identity when available and does not invent it", () => {
	expect(
		feedbackContextFromRuntime("/workspace/project", {
			getSessionId: () => "session-123",
			getSessionFile: () => "/sessions/session-123.jsonl",
		}),
	).toEqual({
		cwd: "/workspace/project",
		sessionId: "session-123",
		sessionFile: "/sessions/session-123.jsonl",
	});

	expect(feedbackContextFromRuntime("/workspace/project", {})).toEqual({ cwd: "/workspace/project" });
});

test("appendFeedbackRecord creates parents and preserves repeated valid JSONL records", async () => {
	const root = await mkdtemp(join(tmpdir(), "omp-kit-feedback-jsonl-"));
	const path = join(root, "nested", "feedback.jsonl");
	const records = [
		buildFeedbackRecord(validInput, { cwd: "/workspace/one", sessionId: "one" }),
		buildFeedbackRecord({ ...validInput, category: "verification" }, { cwd: "/workspace/two", sessionId: "two" }),
	];

	try {
		await appendFeedbackRecord(path, records[0]);
		await appendFeedbackRecord(path, records[1]);
		expect((await stat(join(root, "nested"))).isDirectory()).toBe(true);
		const lines = (await readFile(path, "utf8")).trimEnd().split(/\r?\n/);
		expect(lines).toHaveLength(2);
		expect(lines.map(line => JSON.parse(line))).toEqual(records);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("uses the official agent directory and persists runtime session provenance", async () => {
	await rm(join(getAgentDir(), "omp-kit"), { recursive: true, force: true });
	const registered = registerFeedbackTool();
	const sessionFile = join(isolatedAgentDir, "sessions", "worker.jsonl");
	const result = await invokeTool(registered.tool, "/workspace/from-tool", "worker-session", sessionFile);
	const target = feedbackPath();
	const persisted = JSON.parse(await readFile(target, "utf8"));

	expect(target).toBe(join(isolatedAgentDir, "omp-kit", "feedback.jsonl"));
	expect(persisted).toMatchObject({
		cwd: "/workspace/from-tool",
		sessionId: "worker-session",
		sessionFile,
	});
	expect(detailsFrom(result)).toEqual(persisted);
});

test("registers an evidence-only write-tier feedback tool", () => {
	const registered = registerFeedbackTool();
	expect(registered.tool.name).toBe("omp_kit_feedback");
	expect(registered.tool.approval).toBe("write");
	expect(registered.tool.description).toContain("evidence only");
	expect(registered.tool.parameters.safeParse(validInput).success).toBe(true);
	expect(registered.tool.parameters.safeParse({ ...validInput, severity: "urgent" }).success).toBe(false);
});

test("does not use the network while recording feedback", async () => {
	await rm(join(getAgentDir(), "omp-kit"), { recursive: true, force: true });
	const registered = registerFeedbackTool();
	const originalFetch = globalThis.fetch;
	let networkCalls = 0;
	globalThis.fetch = (async () => {
		networkCalls += 1;
		throw new Error("network access is forbidden in deterministic feedback tests");
	}) as unknown as typeof fetch;

	try {
		await invokeTool(registered.tool);
	} finally {
		globalThis.fetch = originalFetch;
	}

	expect(networkCalls).toBe(0);
});

test("surfaces a durable write failure as a tool error", async () => {
	const target = feedbackPath();
	await rm(join(getAgentDir(), "omp-kit"), { recursive: true, force: true });
	await mkdir(target, { recursive: true });
	const registered = registerFeedbackTool();
	await expect(invokeTool(registered.tool)).rejects.toThrow();
});

test("keeps a durable write successful when appendEntry fails", async () => {
	await rm(join(getAgentDir(), "omp-kit"), { recursive: true, force: true });
	let appendEntryRecord: unknown;
	const registered = registerFeedbackTool((_type, record) => {
		appendEntryRecord = record;
		throw new Error("session provenance append is unavailable");
	});

	const result = await invokeTool(registered.tool);
	const returnedRecord = detailsFrom(result);
	const persistedRecord = JSON.parse(await readFile(feedbackPath(), "utf8"));

	expect(registered.appendEvents).toHaveLength(1);
	const appendEvent = registered.appendEvents[0];
	if (appendEvent === undefined) throw new Error("feedback tool did not call appendEntry");
	expect(appendEvent.type).toBe("omp-kit-feedback");
	expect(appendEntryRecord).toBe(returnedRecord);
	expect(idFrom(appendEntryRecord)).toBe(idFrom(returnedRecord));
	expect(persistedRecord).toEqual(returnedRecord);
	expect(registered.warnings.length).toBeGreaterThan(0);
});
