import { assuranceId, type AssuranceRule, type EvidenceRef, type RuleFinding } from "../model";
import type { ScopeBoundary, ScopeObservation } from "../scope/model";

type ConcreteBoundary = Exclude<ScopeBoundary, "unknown">;

const EVIDENCE_CODE: Record<ConcreteBoundary, string> = {
	workspace: "new-boundary-workspace",
	"host-user": "new-boundary-host-user",
	"host-system": "new-boundary-host-system",
	external: "new-boundary-external",
};

const WRITE_CODE: Record<Exclude<ConcreteBoundary, "workspace">, string> = {
	"host-user": "new-boundary-host-user-write",
	"host-system": "new-boundary-host-system-write",
	external: "new-boundary-external-write",
};

interface ScopeExpansion {
	readonly trackKey: string;
	readonly position: number;
	readonly boundary: ConcreteBoundary;
	readonly observations: readonly ScopeObservation[];
	readonly evidence: readonly EvidenceRef[];
}

function scopeExpansions(observations: readonly ScopeObservation[]): ScopeExpansion[] {
	const byTrack = new Map<string, ScopeObservation[]>();
	for (const observation of observations) {
		if (observation.boundary === "unknown") continue;
		const list = byTrack.get(observation.trackKey) ?? [];
		list.push(observation);
		byTrack.set(observation.trackKey, list);
	}

	const expansions: ScopeExpansion[] = [];
	for (const [trackKey, trackObservations] of byTrack) {
		const byPosition = new Map<number, ScopeObservation[]>();
		for (const observation of trackObservations) {
			const list = byPosition.get(observation.position) ?? [];
			list.push(observation);
			byPosition.set(observation.position, list);
		}

		const seen = new Set<ConcreteBoundary>();
		for (const position of [...byPosition.keys()].sort((a, b) => a - b)) {
			const group = byPosition.get(position) ?? [];
			const boundaries = [...new Set(group.map(item => item.boundary as ConcreteBoundary))].sort();
			if (seen.size > 0) {
				for (const boundary of boundaries) {
					if (seen.has(boundary)) continue;
					const matching = group.filter(item => item.boundary === boundary);
					expansions.push({
						trackKey,
						position,
						boundary,
						observations: matching,
						evidence: matching.flatMap(item => item.evidence),
					});
				}
			}
			for (const boundary of boundaries) seen.add(boundary);
		}
	}
	return expansions;
}

function reviewableCrossBoundaryWrite(expansion: ScopeExpansion): boolean {
	return expansion.boundary !== "workspace" &&
		expansion.observations.some(observation => observation.access === "write");
}

function statusForScope(scope: NonNullable<Parameters<AssuranceRule["evaluate"]>[0]["scope"]>) {
	const partial = scope.traceCoverage === "partial" ||
		scope.actionCoverage.some(item => item.status === "unclassified");
	return partial ? "partial" as const : "evaluated" as const;
}

/**
 * Non-review-triggering scope expansion remains visible as supporting evidence.
 *
 * This intentionally includes read, execute and unknown access, plus workspace-local
 * writes. It does not infer authorization, harmlessness or user intent.
 */
export const scopeExpansionRule: AssuranceRule = {
	meta: {
		id: "omp-kit.scope-expansion",
		version: 2,
		title: "Observed scope expansion",
		description: "Retains first-seen scope expansion as evidence unless the expansion is a high-confidence cross-boundary write.",
		messages: {
			"new-boundary-workspace": "Workspace boundary observed for the first time.",
			"new-boundary-host-user": "Host-user boundary observed for the first time.",
			"new-boundary-host-system": "Host-system boundary observed for the first time.",
			"new-boundary-external": "External boundary observed for the first time.",
		},
		presentation: { section: "evidence", summaryLabel: "Scope boundary observations" },
	},
	evaluate(input) {
		const scope = input.scope;
		if (!scope || scope.traceCoverage === "unavailable") return { status: "skipped", findings: [] };
		const classified = scope.actionCoverage.filter(item => item.status === "classified");
		if (scope.actionCoverage.length > 0 && classified.length === 0) return { status: "skipped", findings: [] };

		const findings: RuleFinding[] = scopeExpansions(scope.observations)
			.filter(expansion => !reviewableCrossBoundaryWrite(expansion))
			.map(expansion => ({
				kind: "scope-expansion",
				subjectId: assuranceId(
					"scope-expansion",
					expansion.trackKey,
					String(expansion.position),
					expansion.boundary,
				),
				code: EVIDENCE_CODE[expansion.boundary],
				evidence: expansion.evidence,
			}));
		return { status: statusForScope(scope), findings };
	},
};

/**
 * Attention is reserved for a new host/external boundary whose first observed
 * expansion includes structured write access. Execute and unknown are not promoted
 * to mutation, and workspace-local writes stay supporting evidence.
 */
export const scopeWriteExpansionRule: AssuranceRule = {
	meta: {
		id: "omp-kit.scope-write-expansion",
		version: 1,
		title: "Cross-boundary write expansion",
		description: "Flags a newly observed host or external boundary when structured scope evidence reports write access.",
		messages: {
			"new-boundary-host-user-write": "Host-user boundary first observed through a write.",
			"new-boundary-host-system-write": "Host-system boundary first observed through a write.",
			"new-boundary-external-write": "External boundary first observed through a write.",
		},
		presentation: { section: "attention", summaryLabel: "Cross-boundary writes" },
	},
	evaluate(input) {
		const scope = input.scope;
		if (!scope || scope.traceCoverage === "unavailable") return { status: "skipped", findings: [] };
		const classified = scope.actionCoverage.filter(item => item.status === "classified");
		if (scope.actionCoverage.length > 0 && classified.length === 0) return { status: "skipped", findings: [] };

		const findings: RuleFinding[] = scopeExpansions(scope.observations)
			.filter(reviewableCrossBoundaryWrite)
			.map(expansion => ({
				kind: "scope-write-expansion",
				subjectId: assuranceId(
					"scope-write-expansion",
					expansion.trackKey,
					String(expansion.position),
					expansion.boundary,
				),
				code: WRITE_CODE[expansion.boundary as keyof typeof WRITE_CODE],
				evidence: expansion.evidence,
			}));
		return { status: statusForScope(scope), findings };
	},
};
