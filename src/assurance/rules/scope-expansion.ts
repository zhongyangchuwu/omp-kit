import { assuranceId, type AssuranceRule, type EvidenceRef, type RuleFinding } from "../model";
import type { ActionFacts, BoundaryObservation, ScopeBoundary } from "../scope/model";

type ConcreteBoundary = Exclude<ScopeBoundary, "unknown">;

const SCOPE_CODE: Record<ConcreteBoundary, string> = {
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
	readonly observations: readonly BoundaryObservation[];
	readonly evidence: readonly EvidenceRef[];
}

function scopeExpansions(observations: readonly BoundaryObservation[]): ScopeExpansion[] {
	const byTrack = new Map<string, BoundaryObservation[]>();
	for (const observation of observations) {
		if (observation.boundary === "unknown") continue;
		const list = byTrack.get(observation.trackKey) ?? [];
		list.push(observation);
		byTrack.set(observation.trackKey, list);
	}

	const expansions: ScopeExpansion[] = [];
	for (const [trackKey, trackObservations] of byTrack) {
		const byPosition = new Map<number, BoundaryObservation[]>();
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

function statusForFacts(facts: ActionFacts) {
	const partial = facts.traceCoverage === "partial" ||
		facts.actionCoverage.some(item => item.status === "unclassified");
	return partial ? "partial" as const : "evaluated" as const;
}

function availableFacts(input: Parameters<AssuranceRule["evaluate"]>[0]): ActionFacts | null {
	const facts = input.actionFacts;
	if (!facts || facts.traceCoverage === "unavailable") return null;
	const classified = facts.actionCoverage.filter(item => item.status === "classified");
	if (facts.actionCoverage.length > 0 && classified.length === 0) return null;
	return facts;
}

/** Boundary expansion is a descriptive scope fact only. */
export const scopeExpansionRule: AssuranceRule = {
	meta: {
		id: "omp-kit.scope-expansion",
		version: 2,
		title: "Observed scope expansion",
		description: "Reports when a later classified action first reaches a new observed boundary on the same track.",
		messages: {
			"new-boundary-workspace": "Workspace boundary observed for the first time.",
			"new-boundary-host-user": "Host-user boundary observed for the first time.",
			"new-boundary-host-system": "Host-system boundary observed for the first time.",
			"new-boundary-external": "External boundary observed for the first time.",
		},
		presentation: { section: "evidence", summaryLabel: "Scope boundary observations" },
	},
	evaluate(input) {
		const facts = availableFacts(input);
		if (!facts) return { status: "skipped", findings: [] };
		const findings: RuleFinding[] = scopeExpansions(facts.boundaries).map(expansion => ({
			kind: "scope-expansion",
			subjectId: assuranceId("scope-expansion", expansion.trackKey, String(expansion.position), expansion.boundary),
			code: SCOPE_CODE[expansion.boundary],
			evidence: expansion.evidence,
		}));
		return { status: statusForFacts(facts), findings };
	},
};

/**
 * Policy composition over independent base facts.
 *
 * A boundary observation and operation observation are joined only when they share
 * the opaque classifier-descriptor group. This avoids inferring write semantics for
 * another boundary emitted by the same multi-effect tool action.
 */
export const crossBoundaryWriteRule: AssuranceRule = {
	meta: {
		id: "omp-kit.cross-boundary-write",
		version: 1,
		title: "Cross-boundary write",
		description: "Flags a newly observed host or external boundary when the same structured classifier group reports a write operation.",
		messages: {
			"new-boundary-host-user-write": "Host-user boundary was first observed with a write operation.",
			"new-boundary-host-system-write": "Host-system boundary was first observed with a write operation.",
			"new-boundary-external-write": "External boundary was first observed with a write operation.",
		},
		presentation: { section: "attention", summaryLabel: "Cross-boundary writes" },
	},
	evaluate(input) {
		const facts = availableFacts(input);
		if (!facts) return { status: "skipped", findings: [] };
		const writeGroups = new Map(
			facts.operations
				.filter(item => item.operation === "write")
				.map(item => [item.groupId, item]),
		);
		const findings: RuleFinding[] = [];
		for (const expansion of scopeExpansions(facts.boundaries)) {
			if (expansion.boundary === "workspace") continue;
			const matchingBoundary = expansion.observations.find(item => writeGroups.has(item.groupId));
			if (!matchingBoundary) continue;
			const operation = writeGroups.get(matchingBoundary.groupId)!;
			findings.push({
				kind: "cross-boundary-write",
				subjectId: assuranceId(
					"cross-boundary-write",
					expansion.trackKey,
					String(expansion.position),
					expansion.boundary,
					matchingBoundary.groupId,
				),
				code: WRITE_CODE[expansion.boundary],
				evidence: [...matchingBoundary.evidence, ...operation.evidence],
			});
		}
		return { status: statusForFacts(facts), findings };
	},
};
