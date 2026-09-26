import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getAgentDir, type ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { agentContextFromRuntime, type AgentContextEvidence } from "../src/session/agent-context";

export const FEEDBACK_CATEGORIES = [
	"activation",
	"delegation",
	"context",
	"supervision",
	"verification",
	"capability",
	"overhead",
	"upstream",
] as const;

export const FEEDBACK_SEVERITIES = ["low", "medium", "high"] as const;

export const MAX_SUMMARY_LENGTH = 280;
export const MAX_EVIDENCE_LENGTH = 2_000;
export const MAX_SUGGESTED_DIRECTION_LENGTH = 1_000;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackSeverity = (typeof FEEDBACK_SEVERITIES)[number];

export interface FeedbackInput {
	category: FeedbackCategory;
	severity: FeedbackSeverity;
	summary: string;
	evidence?: string;
	suggestedDirection?: string;
}

export interface FeedbackContext {
	cwd: string;
	sessionId?: string;
	sessionFile?: string;
	agent?: AgentContextEvidence;
}

export interface FeedbackRecord extends FeedbackInput {
	schemaVersion: 1;
	id: string;
	timestamp: string;
	cwd: string;
	sessionId?: string;
	sessionFile?: string;
	agent?: AgentContextEvidence;
}

type SessionProvenance = {
	getSessionId?: () => string;
	getSessionFile?: () => string | undefined;
};

export function createFeedbackSchema(zod: ExtensionAPI["zod"]) {
	const boundedText = (max: number) => zod.string().min(1).max(max).refine(value => value.trim().length > 0, "must be non-empty");

	return zod
		.object({
			category: zod.enum(FEEDBACK_CATEGORIES),
			severity: zod.enum(FEEDBACK_SEVERITIES),
			summary: boundedText(MAX_SUMMARY_LENGTH),
			evidence: boundedText(MAX_EVIDENCE_LENGTH).optional(),
			suggestedDirection: boundedText(MAX_SUGGESTED_DIRECTION_LENGTH).optional(),
		})
		.strict();
}

export function buildFeedbackRecord(input: FeedbackInput, context: FeedbackContext): FeedbackRecord {
	return {
		schemaVersion: 1,
		id: randomUUID(),
		timestamp: new Date().toISOString(),
		cwd: context.cwd,
		...(context.sessionId === undefined ? {} : { sessionId: context.sessionId }),
		...(context.sessionFile === undefined ? {} : { sessionFile: context.sessionFile }),
		...(context.agent && Object.keys(context.agent).length > 0 ? { agent: context.agent } : {}),
		category: input.category,
		severity: input.severity,
		summary: input.summary,
		...(input.evidence === undefined ? {} : { evidence: input.evidence }),
		...(input.suggestedDirection === undefined ? {} : { suggestedDirection: input.suggestedDirection }),
	};
}

export function feedbackContextFromRuntime(
	cwd: string,
	sessionManager: SessionProvenance,
	agentContext?: AgentContextEvidence,
): FeedbackContext {
	const sessionId = sessionManager.getSessionId?.();
	const sessionFile = sessionManager.getSessionFile?.();
	return {
		cwd,
		...(sessionId ? { sessionId } : {}),
		...(sessionFile ? { sessionFile } : {}),
		...(agentContext && Object.keys(agentContext).length > 0 ? { agent: agentContext } : {}),
	};
}

export async function appendFeedbackRecord(filePath: string, record: FeedbackRecord): Promise<void> {
	await mkdir(dirname(filePath), { recursive: true });
	await appendFile(filePath, `${JSON.stringify(record)}\n`, "utf8");
}

export default function feedbackExtension(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "omp_kit_feedback",
		label: "OMP Kit Feedback",
		description:
			"Record a concise, evidence-backed omp-kit workflow finding for later review. This records evidence only; it does not authorize repository, policy, or Harness changes.",
		approval: "write",
		parameters: createFeedbackSchema(pi.zod),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const record = buildFeedbackRecord(
				params,
				feedbackContextFromRuntime(ctx.cwd, ctx.sessionManager, agentContextFromRuntime(ctx)),
			);
			const filePath = join(getAgentDir(), "omp-kit", "feedback.jsonl");

			await appendFeedbackRecord(filePath, record);

			try {
				await pi.appendEntry("omp-kit-feedback", record);
			} catch (error) {
				pi.logger.warn("omp-kit feedback session provenance append failed", {
					id: record.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}

			return {
				content: [{ type: "text", text: "Feedback recorded as evidence." }],
				details: record,
			};
		},
	});
}
