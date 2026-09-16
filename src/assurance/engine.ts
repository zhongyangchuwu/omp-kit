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
		const { meta } = rule;
		if (!meta || !TOKEN.test(meta.id) || ids.has(meta.id) || !Number.isSafeInteger(meta.version) || meta.version < 1 ||
			!meta.title?.trim() || !meta.description?.trim() || !isObject(meta.messages) ||
			!meta.presentation || !["attention", "coverage"].includes(meta.presentation.section) ||
			(meta.presentation.summaryLabel !== undefined && !meta.presentation.summaryLabel.trim()) ||
			(meta.presentation.section === "attention" && !meta.presentation.summaryLabel?.trim()) ||
			Object.entries(meta.messages).some(([code, message]) => !TOKEN.test(code) || typeof message !== "string" || !message.trim()) ||
			typeof rule.evaluate !== "function") {
			throw new Error("Invalid or duplicate assurance rule definition");
		}
		ids.add(meta.id);
	}
}

function normalizeFinding(rule: AssuranceRule, value: unknown): Finding | null {
	if (!isObject(value) || !TOKEN.test(String(value.kind ?? "")) || !TOKEN.test(String(value.code ?? "")) ||
		typeof value.subjectId !== "string" || !value.subjectId || !Array.isArray(value.evidence) ||
		!value.evidence.every(validEvidence) || !(String(value.code) in rule.meta.messages)) return null;
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

function executeRule(rule: AssuranceRule, input: AssuranceInput): RuleResult {
	let raw: RuleEvaluation;
	try {
		raw = rule.evaluate(input);
	} catch {
		return { ruleId: rule.meta.id, ruleVersion: rule.meta.version, status: "failed", failure: "exception", findings: [] };
	}
	if (!raw || !["evaluated", "partial", "skipped"].includes(raw.status) || !Array.isArray(raw.findings) ||
		(raw.status === "skipped" && raw.findings.length > 0)) {
		return { ruleId: rule.meta.id, ruleVersion: rule.meta.version, status: "failed", failure: "invalid-output", findings: [] };
	}
	const findings = raw.findings.map(item => normalizeFinding(rule, item));
	if (findings.some(item => item === null)) {
		return { ruleId: rule.meta.id, ruleVersion: rule.meta.version, status: "failed", failure: "invalid-output", findings: [] };
	}
	return { ruleId: rule.meta.id, ruleVersion: rule.meta.version, status: raw.status,
		findings: (findings as Finding[]).sort(compareIds) };
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
