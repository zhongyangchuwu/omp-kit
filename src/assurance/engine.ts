import {
	ASSURANCE_SCHEMA,
	assuranceId,
	compareIds,
	type AssuranceInput,
	type AssuranceReport,
	type AssuranceRule,
	type EvidenceRef,
	type Finding,
	type RuleEvaluation,
	type RuleFinding,
	type RuleResult,
} from "./model";

const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;

function freezeDeep<T>(value: T): T {
	if (value && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) freezeDeep(child);
		Object.freeze(value);
	}
	return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyText(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function validEvidence(value: unknown): value is EvidenceRef {
	if (!isObject(value)) return false;
	for (const key of ["sourceId", "sessionKey", "trackId", "spanId"] as const) {
		if (typeof value[key] !== "string") return false;
	}
	for (const key of ["entryId", "toolCallId"] as const) {
		if (value[key] !== undefined && typeof value[key] !== "string") return false;
	}
	return true;
}

function validateRules(rules: readonly AssuranceRule[]): void {
	const ids = new Set<string>();
	for (const rule of rules) {
		const meta = rule?.meta;
		if (!meta || typeof meta.id !== "string" || !TOKEN.test(meta.id) || ids.has(meta.id) ||
			!Number.isSafeInteger(meta.version) || meta.version < 1 || !nonEmptyText(meta.title) || !nonEmptyText(meta.description) ||
			!isObject(meta.messages) || !isObject(meta.presentation) || !["attention", "evidence", "coverage"].includes(String(meta.presentation.section)) ||
			(meta.presentation.summaryLabel !== undefined && !nonEmptyText(meta.presentation.summaryLabel)) ||
			((meta.presentation.section === "attention" || meta.presentation.section === "evidence") && !nonEmptyText(meta.presentation.summaryLabel)) ||
			Object.entries(meta.messages).some(([code, message]) => !TOKEN.test(code) || !nonEmptyText(message)) ||
			typeof rule.evaluate !== "function") {
			throw new Error("Invalid or duplicate assurance rule definition");
		}
		ids.add(meta.id);
	}
}

function normalizeFinding(rule: AssuranceRule, value: unknown): Finding | null {
	if (!isObject(value) || typeof value.kind !== "string" || !TOKEN.test(value.kind) ||
		typeof value.code !== "string" || !TOKEN.test(value.code) || typeof value.subjectId !== "string" || !value.subjectId ||
		!Array.isArray(value.evidence) || !value.evidence.every(validEvidence) || !(value.code in rule.meta.messages)) return null;
	const local = value as unknown as RuleFinding;
	return {
		id: assuranceId(rule.meta.id, String(rule.meta.version), local.kind, local.subjectId, local.code),
		kind: local.kind,
		ruleId: rule.meta.id,
		ruleVersion: rule.meta.version,
		subjectId: local.subjectId,
		code: local.code,
		evidence: structuredClone([...local.evidence]),
	};
}

function failedRuleResult(rule: AssuranceRule, failure: RuleResult["failure"]): RuleResult {
	return {
		ruleId: rule.meta.id,
		ruleVersion: rule.meta.version,
		presentation: structuredClone(rule.meta.presentation),
		status: "failed",
		failure,
		findings: [],
	};
}

function executeRule(rule: AssuranceRule, input: AssuranceInput): RuleResult {
	let raw: RuleEvaluation;
	try {
		raw = rule.evaluate(input);
	} catch {
		return failedRuleResult(rule, "exception");
	}
	if (!raw || !["evaluated", "partial", "skipped"].includes(raw.status) || !Array.isArray(raw.findings) ||
		(raw.status === "skipped" && raw.findings.length > 0)) {
		return failedRuleResult(rule, "invalid-output");
	}
	const findings = raw.findings.map(item => normalizeFinding(rule, item));
	if (findings.some(item => item === null)) return failedRuleResult(rule, "invalid-output");
	return {
		ruleId: rule.meta.id,
		ruleVersion: rule.meta.version,
		presentation: structuredClone(rule.meta.presentation),
		status: raw.status,
		findings: (findings as Finding[]).sort(compareIds),
	};
}

/** Generic deterministic rule engine. It imports no concrete rules, registry, profile, IO or renderer. */
export function buildAssuranceReport(input: AssuranceInput, rules: readonly AssuranceRule[]): AssuranceReport {
	validateRules(rules);
	const observations = freezeDeep(structuredClone(input));
	const results = rules.map(rule => executeRule(rule, observations))
		.sort((a, b) => a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : a.ruleVersion - b.ruleVersion);
	const findings = [...new Map(results.flatMap(result => result.findings).map(item => [item.id, item])).values()].sort(compareIds);
	return { schemaVersion: ASSURANCE_SCHEMA, ...observations, rules: results, findings };
}
