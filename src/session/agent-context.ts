import type { ExtensionCommandContext } from "@oh-my-pi/pi-coding-agent";

/**
 * Minimal agent provenance surface consumed by evidence and assurance.
 *
 * This intentionally avoids persisting the full runtime agent object. OMP
 * versions may add fields; omp-kit only records the identity needed to explain
 * which worker produced an observation.
 */
export interface AgentContextEvidence {
	readonly name?: string;
	readonly depth?: number;
	readonly parentId?: string;
}

function asOptionalString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

/**
 * Extract the stable subset exposed by OMP 18.3.x agent context.
 *
 * Kept defensive so older OMP runtimes fail closed rather than making the
 * evidence extension unusable.
 */
export function agentContextFromRuntime(
	ctx: Pick<ExtensionCommandContext, "agent"> | { agent?: unknown },
): AgentContextEvidence {
	const agent = ctx.agent;
	if (!agent || typeof agent !== "object") return {};

	const value = agent as Record<string, unknown>;
	return {
		name: asOptionalString(value.name),
		depth: asOptionalNumber(value.depth),
		parentId: asOptionalString(value.parentId),
	};
}
