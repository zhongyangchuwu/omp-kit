import type { AssuranceRule } from "./model";

/** Default enablement is policy/configuration, separate from rule registration. */
export const DEFAULT_ASSURANCE_PROFILE: readonly string[] = Object.freeze([
	"omp-kit.tool-error",
	"omp-kit.terminal-missing",
	"omp-kit.coverage-gap",
	"omp-kit.scope-expansion",
]);

export function resolveAssuranceProfile(
	registry: readonly AssuranceRule[],
	ruleIds: readonly string[],
): readonly AssuranceRule[] {
	const seen = new Set<string>();
	const selected: AssuranceRule[] = [];
	for (const id of ruleIds) {
		if (seen.has(id)) throw new Error("Duplicate assurance rule in profile");
		seen.add(id);
		const rule = registry.find(candidate => candidate.meta.id === id);
		if (!rule) throw new Error("Unknown assurance rule in profile");
		selected.push(rule);
	}
	return Object.freeze(selected);
}
