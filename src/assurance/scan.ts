import type { SessionSummary } from "@oh-my-pi/omp-stats/shared-types";
import { sessionKey } from "../evidence/session-evidence";
import type { AssuranceReport, RulePresentation } from "./model";
import type { ActionFactDerivationDiagnostics } from "./scope/derive";

export const ASSURANCE_SCAN_SCHEMA = "omp-kit.session-assurance-scan/v2" as const;

const BASELINE_COVERAGE_CODES = new Set([
	"active-branches-only",
	"child-completeness-unknown",
	"details-are-previews",
	"not-an-atomic-snapshot",
	"process-network-unobserved",
	"tool-and-background-only",
]);

export interface AssuranceScanRow {
	readonly summary: SessionSummary;
	readonly report: AssuranceReport;
	readonly actionFactDiagnostics?: Readonly<ActionFactDerivationDiagnostics>;
}

export interface AssuranceScanCandidate {
	readonly key: string;
	readonly startedAt: number;
	readonly endedAt: number;
	readonly actions: number;
	readonly subagents: number;
	readonly attentionFindings: number;
	readonly dynamicCoverageGaps: number;
	readonly codes: readonly string[];
}

export interface AssuranceScanReport {
	readonly schemaVersion: typeof ASSURANCE_SCAN_SCHEMA;
	readonly generatedAt: string;
	readonly mode: "trace-only" | "full";
	readonly filters: {
		readonly folderApplied: boolean;
		readonly since: number | null;
		readonly limit: number;
	};
	readonly discovery: {
		readonly syncAvailable: boolean;
		readonly listAvailable: boolean;
		readonly returned: number;
		readonly limitations: readonly string[];
		readonly reason?: string;
	};
	readonly sessions: {
		readonly scanned: number;
		readonly assessed: number;
		readonly candidates: number;
	};
	readonly totals: {
		readonly actions: number;
		readonly subagents: number;
		readonly attentionFindings: number;
		readonly dynamicCoverageGaps: number;
	};
	readonly performance?: {
		readonly actionFacts: Readonly<ActionFactDerivationDiagnostics>;
	};
	readonly findingCounts: Readonly<Record<string, number>>;
	readonly candidates: readonly AssuranceScanCandidate[];
}

function findingKey(kind: string, code: string): string {
	return `${kind}:${code}`;
}

function sectionByRule(report: AssuranceReport): Map<string, RulePresentation["section"]> {
	return new Map(report.rules.map(rule => [rule.ruleId, rule.presentation.section]));
}

function isDynamicCoverage(kind: string, code: string, section: RulePresentation["section"] | undefined): boolean {
	return section === "coverage" && kind === "coverage-gap" && !BASELINE_COVERAGE_CODES.has(code);
}

function candidateFor(row: AssuranceScanRow): AssuranceScanCandidate | null {
	const sections = sectionByRule(row.report);
	const attention = row.report.findings.filter(finding => sections.get(finding.ruleId) === "attention");
	const dynamicCoverage = row.report.findings.filter(finding =>
		isDynamicCoverage(finding.kind, finding.code, sections.get(finding.ruleId)),
	);
	if (attention.length === 0 && dynamicCoverage.length === 0) return null;
	const context = row.report.findings.filter(finding => {
		const section = sections.get(finding.ruleId);
		return section === "attention" || section === "evidence" || isDynamicCoverage(finding.kind, finding.code, section);
	});
	const codes = [...new Set(context.map(finding => findingKey(finding.kind, finding.code)))].sort();
	return {
		key: sessionKey(row.summary.file),
		startedAt: row.summary.startedAt,
		endedAt: row.summary.endedAt,
		actions: row.report.actions.length,
		subagents: row.summary.subagents,
		attentionFindings: attention.length,
		dynamicCoverageGaps: dynamicCoverage.length,
		codes,
	};
}

function aggregateActionFactDiagnostics(rows: readonly AssuranceScanRow[]): ActionFactDerivationDiagnostics | null {
	const diagnostics = rows.flatMap(row => row.actionFactDiagnostics ? [row.actionFactDiagnostics] : []);
	if (diagnostics.length === 0) return null;
	const total: ActionFactDerivationDiagnostics = {
		candidates: 0,
		prefilteredUnsupported: 0,
		recoveryAttempts: 0,
		entryReadRequests: 0,
		entryCacheHits: 0,
		parentHops: 0,
		recoveryMs: 0,
		classificationMs: 0,
		totalMs: 0,
	};
	for (const item of diagnostics) {
		total.candidates += item.candidates;
		total.prefilteredUnsupported += item.prefilteredUnsupported;
		total.recoveryAttempts += item.recoveryAttempts;
		total.entryReadRequests += item.entryReadRequests;
		total.entryCacheHits += item.entryCacheHits;
		total.parentHops += item.parentHops;
		total.recoveryMs += item.recoveryMs;
		total.classificationMs += item.classificationMs;
		total.totalMs += item.totalMs;
	}
	return total;
}

export function buildAssuranceScanReport(
	rows: readonly AssuranceScanRow[],
	options: {
		readonly mode: "trace-only" | "full";
		readonly folderApplied: boolean;
		readonly since: number | null;
		readonly limit: number;
		readonly syncAvailable: boolean;
		readonly listAvailable: boolean;
		readonly returned: number;
		readonly discoveryLimitations?: readonly string[];
		readonly discoveryReason?: string;
	},
): AssuranceScanReport {
	const findingCounts: Record<string, number> = {};
	let actions = 0;
	let subagents = 0;
	let attentionFindings = 0;
	let dynamicCoverageGaps = 0;
	let assessed = 0;
	const candidates: AssuranceScanCandidate[] = [];
	for (const row of rows) {
		actions += row.report.actions.length;
		subagents += row.summary.subagents;
		if (row.report.coverage.every(source => source.assessed) && row.report.rules.every(rule => rule.status !== "failed")) assessed += 1;
		const sections = sectionByRule(row.report);
		for (const finding of row.report.findings) {
			const key = findingKey(finding.kind, finding.code);
			findingCounts[key] = (findingCounts[key] ?? 0) + 1;
			const section = sections.get(finding.ruleId);
			if (section === "attention") attentionFindings += 1;
			else if (isDynamicCoverage(finding.kind, finding.code, section)) dynamicCoverageGaps += 1;
		}
		const candidate = candidateFor(row);
		if (candidate) candidates.push(candidate);
	}
	candidates.sort((a, b) =>
		b.attentionFindings - a.attentionFindings ||
		b.dynamicCoverageGaps - a.dynamicCoverageGaps ||
		b.endedAt - a.endedAt ||
		a.key.localeCompare(b.key),
	);
	const actionFactDiagnostics = aggregateActionFactDiagnostics(rows);
	return {
		schemaVersion: ASSURANCE_SCAN_SCHEMA,
		generatedAt: new Date().toISOString(),
		mode: options.mode,
		filters: { folderApplied: options.folderApplied, since: options.since, limit: options.limit },
		discovery: {
			syncAvailable: options.syncAvailable,
			listAvailable: options.listAvailable,
			returned: options.returned,
			limitations: [...(options.discoveryLimitations ?? [])],
			...(options.discoveryReason ? { reason: options.discoveryReason } : {}),
		},
		sessions: { scanned: rows.length, assessed, candidates: candidates.length },
		totals: { actions, subagents, attentionFindings, dynamicCoverageGaps },
		...(actionFactDiagnostics ? { performance: { actionFacts: actionFactDiagnostics } } : {}),
		findingCounts: Object.fromEntries(Object.entries(findingCounts).sort(([a], [b]) => a.localeCompare(b))),
		candidates,
	};
}
