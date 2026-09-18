import type { AssuranceRule } from "./model";
import { coverageGapRule } from "./rules/coverage-gap";
import { resolutionGapRule } from "./rules/resolution-gap";
import { scopeExpansionRule, scopeWriteExpansionRule } from "./rules/scope-expansion";
import { missingTerminalRule } from "./rules/terminal-missing";
import { toolErrorRule } from "./rules/tool-error";

/** All built-in rules known to this package. Registry membership does not imply enablement. */
export const BUILTIN_ASSURANCE_RULES: readonly AssuranceRule[] = Object.freeze([
	coverageGapRule,
	resolutionGapRule,
	scopeExpansionRule,
	scopeWriteExpansionRule,
	missingTerminalRule,
	toolErrorRule,
].sort((a, b) => a.meta.id < b.meta.id ? -1 : a.meta.id > b.meta.id ? 1 : 0));

export function assuranceRuleById(registry: readonly AssuranceRule[], id: string): AssuranceRule | undefined {
	return registry.find(rule => rule.meta.id === id);
}
