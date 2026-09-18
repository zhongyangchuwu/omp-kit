import type { AssuranceReport, AssuranceRule, AssuranceRuleMeta, Finding, RuleResult } from "./model";
import type { OperationType, ResourceKind, ScopeBoundary } from "./scope/model";

export type AssurancePresentationMode = "scan" | "full";
export type AssuranceTone = "accent" | "success" | "warning" | "error" | "muted" | "dim" | "text";
export type AssuranceStyler = (tone: AssuranceTone, text: string) => string;

export interface AssuranceRenderOptions {
	readonly mode?: AssurancePresentationMode;
}

interface FindingView {
	readonly message: string;
	readonly context: string | null;
}

interface SupportingView {
	readonly label: string;
	readonly count: number;
}

interface RuntimeView {
	readonly activeEntries: number;
	readonly offBranchEntries: number;
	readonly retainedTree: boolean;
	readonly toolActions: number;
	readonly observedToolTerminals: number;
	readonly missingToolTerminals: number;
	readonly jobs: readonly {
		readonly id: string;
		readonly status: "completed" | "failed" | "cancelled";
		readonly branch: "active" | "off-branch";
	}[];
	readonly retainedFactClassified: number;
	readonly retainedFactUnclassified: number;
	readonly retainedFactUnassessed: number;
}

interface ActionFactsView {
	readonly boundaries: readonly ScopeBoundary[];
	readonly operations: readonly OperationType[];
	readonly resources: readonly ResourceKind[];
	readonly classified: number;
	readonly unclassified: number;
	readonly available: boolean;
}

interface AssurancePresentation {
	readonly title: string;
	readonly assessmentIncomplete: boolean;
	readonly attention: readonly FindingView[];
	readonly supporting: readonly SupportingView[];
	readonly runtime: RuntimeView | null;
	readonly actionFacts: ActionFactsView | null;
	readonly inspected: readonly string[];
	readonly visibility: readonly string[];
}

/** Escape terminal controls/bidi and bound identifiers. This is display safety, not redaction. */
function atom(text: string): string {
	return text.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, "?").slice(0, 160);
}

function fallbackMeta(result: RuleResult): AssuranceRuleMeta {
	return {
		id: result.ruleId,
		version: result.ruleVersion,
		title: result.ruleId,
		description: "Rule metadata was not supplied to this renderer.",
		messages: {},
		presentation: result.presentation,
	};
}

function message(meta: AssuranceRuleMeta, finding: Finding): string {
	return meta.messages[finding.code] ?? finding.code;
}

function plural(count: number, singular: string, pluralValue = `${singular}s`): string {
	return count === 1 ? singular : pluralValue;
}

function findingContext(finding: Finding): string | null {
	const ref = finding.evidence[0];
	if (!ref) return null;
	const track = ref.trackId === "main" ? "Main" : atom(ref.trackId);
	if (ref.entryId) return `${track} · entry ${atom(ref.entryId).slice(0, 12)}`;
	return `${track} · trace evidence`;
}

const BOUNDARY_ORDER: readonly ScopeBoundary[] = ["workspace", "host-user", "host-system", "external", "unknown"];
const OPERATION_ORDER: readonly OperationType[] = ["read", "write", "execute", "unknown"];
const RESOURCE_ORDER: readonly ResourceKind[] = ["filesystem", "version-control", "service", "network", "process", "configuration", "package", "unknown"];

const VISIBILITY_LABELS: Readonly<Record<string, string>> = {
	"http": "The evidence source returned an HTTP failure.",
	"transport": "The evidence source could not be reached.",
	"invalid-json": "The evidence source returned invalid JSON.",
	"invalid-envelope": "The evidence source returned an invalid payload.",
	"aborted": "An evidence read was aborted.",
	"runtime-unavailable": "The runtime evidence source was unavailable.",
	"runtime-read-failed": "The runtime evidence source could not be read.",
	"rule-evaluation-failed": "An Assurance rule could not be evaluated.",
	"source-changed": "The evidence source changed during the read.",
	"unexpected-view": "A requested evidence view was not available.",
	"invalid-trace": "Some trace fields could not be interpreted.",
	"bounded-session-list": "Session discovery is bounded.",
	"list-limit-reached": "The session list reached its requested limit.",
	"active-branches-only": "Trace-derived evidence represents active branches only.",
	"child-completeness-unknown": "Child/subagent trace completeness is not guaranteed.",
	"details-are-previews": "Trace details are previews, not full commands.",
	"single-session-only": "This report covers one session.",
	"retained-entries-only": "Retained entries do not include erased or external history.",
	"not-an-atomic-snapshot": "Cross-track reads are not an atomic snapshot.",
	"conflicting-observations": "Conflicting observations were retained rather than resolved.",
	"no-trace-input": "No trace input was available.",
	"process-network-unobserved": "Process and network effects are not exhaustively observed.",
	"tool-and-background-only": "Current rules cover tool/background evidence, not task quality.",
	"declared-targets-only": "Scope describes declared targets only.",
	"generic-shell-unclassified": "Generic shell effects are not classified.",
	"path-symlink-target-unverified": "Filesystem symlink targets are not verified.",
	"child-workspace-root-unverified": "Child workspace roots are not verified.",
	"cross-track-order-unavailable": "Cross-track causal order is unavailable.",
	"main-session-only": "Retained-tree traversal covers the Main session only.",
	"child-retained-history-unavailable": "Retained child/subagent branches are not fully available.",
	"invalid-retained-entry-shape": "Some retained entries could not be interpreted.",
	"retained-tool-scope-declared-targets-only": "Retained tool scope describes declared targets only.",
	"retained-workspace-root-unverified": "Historical workspace roots are not verified.",
	"retained-generic-shell-unclassified": "Generic shell effects in retained history are not classified.",
};

function coverageCodeOrder(code: string): number {
	const priority = [
		"rule-evaluation-failed",
		"runtime-read-failed",
		"runtime-unavailable",
		"source-changed",
		"conflicting-observations",
		"child-retained-history-unavailable",
		"child-completeness-unknown",
		"retained-workspace-root-unverified",
		"child-workspace-root-unverified",
		"retained-generic-shell-unclassified",
		"generic-shell-unclassified",
		"process-network-unobserved",
		"cross-track-order-unavailable",
		"not-an-atomic-snapshot",
		"retained-entries-only",
		"active-branches-only",
		"details-are-previews",
		"single-session-only",
		"tool-and-background-only",
	];
	const index = priority.indexOf(code);
	return index < 0 ? priority.length : index;
}

function sourceViewLabel(view: string): string {
	if (view === "active-branch-trace") return "Active trace";
	if (view === "active-branch-entries") return "Active Main entries";
	if (view === "all-retained-entries") return "Retained Main tree";
	if (view === "selected-entry") return "Selected tool entries";
	if (view === "session-list") return "Session catalog";
	if (view === "sync") return "Session sync";
	return atom(view);
}

export function buildAssurancePresentation(
	report: AssuranceReport,
	registry: readonly AssuranceRule[],
	options: AssuranceRenderOptions = {},
): AssurancePresentation {
	const metaById = new Map(registry.map(rule => [rule.meta.id, rule.meta]));
	const metaFor = (result: RuleResult) => metaById.get(result.ruleId) ?? fallbackMeta(result);

	const attention = report.rules
		.filter(result => result.presentation.section === "attention")
		.flatMap(result => result.findings.map(finding => ({
			message: atom(message(metaFor(result), finding)),
			context: findingContext(finding),
		})));

	const supporting = report.rules
		.filter(result => result.presentation.section === "evidence")
		.flatMap(result => {
			const meta = metaFor(result);
			if (result.status !== "evaluated" && result.status !== "partial") return [];
			if (result.findings.length === 0) return [];
			return [{
				label: atom(meta.presentation.summaryLabel ?? meta.title),
				count: result.findings.length,
			}];
		});

	const runtime: RuntimeView | null = report.runtime ? (() => {
		const activeEntries = report.runtime.entries.filter(item => item.branch === "active").length;
		const offBranchEntries = report.runtime.entries.length - activeEntries;
		const observedToolTerminals = report.runtime.toolActions.filter(item => item.terminal === "observed").length;
		const missingToolTerminals = report.runtime.toolActions.length - observedToolTerminals;
		const retainedFactClassified = report.runtime.toolActions.filter(item => item.factStatus === "classified").length;
		const retainedFactUnclassified = report.runtime.toolActions.filter(item => item.factStatus === "unclassified").length;
		const retainedFactUnassessed = report.runtime.toolActions.filter(item => item.factStatus === "not-assessed").length;
		return {
			activeEntries,
			offBranchEntries,
			retainedTree: report.runtime.retainedTree,
			toolActions: report.runtime.toolActions.length,
			observedToolTerminals,
			missingToolTerminals,
			jobs: report.runtime.jobResolutions.map(item => ({
				id: atom(item.jobId),
				status: item.status,
				branch: item.branch,
			})),
			retainedFactClassified,
			retainedFactUnclassified,
			retainedFactUnassessed,
		};
	})() : null;

	const actionFacts: ActionFactsView | null = report.actionFacts ? (() => {
		const observedBoundaries = new Set(report.actionFacts.boundaries.map(item => item.boundary));
		const observedOperations = new Set(report.actionFacts.operations.map(item => item.operation));
		const observedResources = new Set(report.actionFacts.resources.map(item => item.resource));
		const classified = report.actionFacts.actionCoverage.filter(item => item.status === "classified").length;
		return {
			boundaries: BOUNDARY_ORDER.filter(value => observedBoundaries.has(value)),
			operations: OPERATION_ORDER.filter(value => observedOperations.has(value)),
			resources: RESOURCE_ORDER.filter(value => observedResources.has(value)),
			classified,
			unclassified: report.actionFacts.actionCoverage.length - classified,
			available: report.actionFacts.traceCoverage !== "unavailable",
		};
	})() : null;

	const inspected = new Set<string>();
	for (const source of report.coverage) {
		if (source.assessed) inspected.add(sourceViewLabel(source.scope.view));
	}
	if (actionFacts?.available) inspected.add("Structured action facts where supported");

	const visibilityCodes = new Set<string>();
	for (const limitation of report.runtime?.limitations ?? []) visibilityCodes.add(limitation);
	for (const limitation of report.actionFacts?.limitations ?? []) visibilityCodes.add(limitation);
	for (const source of report.coverage) {
		for (const limitation of source.limitations) visibilityCodes.add(limitation);
		if (!source.assessed && source.reason) visibilityCodes.add(source.reason);
	}
	for (const result of report.rules.filter(item => item.presentation.section === "coverage")) {
		for (const finding of result.findings) visibilityCodes.add(finding.code);
	}
	for (const result of report.rules) {
		if (result.status === "failed") visibilityCodes.add("rule-evaluation-failed");
	}

	const visibility = [...visibilityCodes]
		.sort((a, b) => coverageCodeOrder(a) - coverageCodeOrder(b) || a.localeCompare(b))
		.map(code => VISIBILITY_LABELS[code] ?? atom(code));

	const assessmentIncomplete =
		report.coverage.some(source => !source.assessed) ||
		report.rules.some(result => result.status === "failed");

	return {
		title: options.mode === "full" ? "Assurance · Full" : "Assurance",
		assessmentIncomplete,
		attention,
		supporting,
		runtime,
		actionFacts,
		inspected: [...inspected],
		visibility,
	};
}

function pushRuntimeText(lines: string[], view: RuntimeView): void {
	lines.push("  Main session");
	if (view.retainedTree) {
		lines.push(`    Current path: ${view.activeEntries} retained entries`);
		lines.push(`    Other branches: ${view.offBranchEntries} retained entries`);
	} else {
		lines.push(`    ${view.activeEntries} active entries`);
	}
	if (view.toolActions > 0) {
		const terminalParts = [
			`${view.toolActions} Main tool ${plural(view.toolActions, "action")}`,
			`${view.observedToolTerminals} terminal ${plural(view.observedToolTerminals, "result")}`,
		];
		if (view.missingToolTerminals > 0) terminalParts.push(`${view.missingToolTerminals} missing terminal`);
		lines.push(`    ${terminalParts.join(" · ")}`);
	}

	if (view.jobs.length > 0) {
		lines.push("  Background jobs");
		for (const job of view.jobs.slice(0, 8)) {
			const marker = job.status === "failed" ? "✗" : "✓";
			const branch = job.branch === "off-branch" ? " · off-branch" : "";
			lines.push(`    ${marker} ${job.id} · ${job.status}${branch}`);
		}
		if (view.jobs.length > 8) lines.push(`    · ${view.jobs.length - 8} more terminal job facts in JSON`);
	}
}

function pushActionFactsText(lines: string[], presentation: AssurancePresentation): void {
	const facts = presentation.actionFacts;
	if (!facts?.available) return;
	lines.push("  Boundaries");
	lines.push(`    ${facts.boundaries.length ? facts.boundaries.join(", ") : "none classified"}`);
	lines.push("  Operations");
	lines.push(`    ${facts.operations.length ? facts.operations.join(", ") : "none classified"}`);
	lines.push("  Resources");
	lines.push(`    ${facts.resources.length ? facts.resources.join(", ") : "none classified"}`);
}

function pushSupportingText(lines: string[], supporting: readonly SupportingView[]): void {
	if (supporting.length === 0) return;
	lines.push("  Supporting observations");
	for (const item of supporting) lines.push(`    · ${item.label}: ${item.count}`);
}

function pushClassificationText(lines: string[], presentation: AssurancePresentation): void {
	const runtime = presentation.runtime;
	const actionFacts = presentation.actionFacts;
	const hasRuntimeClassification = runtime &&
		(runtime.retainedFactClassified > 0 || runtime.retainedFactUnclassified > 0 || runtime.retainedFactUnassessed > 0);
	const hasTraceClassification = actionFacts?.available && (actionFacts.classified > 0 || actionFacts.unclassified > 0);
	if (!hasRuntimeClassification && !hasTraceClassification) return;
	lines.push("  Classification");
	if (hasRuntimeClassification && runtime) {
		const parts = [
			`${runtime.retainedFactClassified} classified`,
			`${runtime.retainedFactUnclassified} unclassified`,
		];
		if (runtime.retainedFactUnassessed > 0) parts.push(`${runtime.retainedFactUnassessed} not assessed`);
		lines.push(`    Retained Main tools: ${parts.join(" · ")}`);
	}
	if (hasTraceClassification && actionFacts) {
		lines.push(`    Trace tools: ${actionFacts.classified} classified · ${actionFacts.unclassified} unclassified`);
	}
}

/** Human-facing plain-text report. Machine/debug rule details remain in JSON. */
export function renderAssuranceReport(
	report: AssuranceReport,
	registry: readonly AssuranceRule[],
	options: AssuranceRenderOptions = {},
): string {
	const presentation = buildAssurancePresentation(report, registry, options);
	const lines = [presentation.title, "", "Needs review"];
	if (presentation.attention.length === 0 && !presentation.assessmentIncomplete) {
		lines.push("  ✓ Nothing needs review");
	} else if (presentation.attention.length === 0) {
		lines.push("  ! Assessment incomplete · see Visibility");
		lines.push("  · No review items found in the evidence that was available");
	} else {
		lines.push(`  ! ${presentation.attention.length} ${plural(presentation.attention.length, "item")} worth reviewing`);
		for (const item of presentation.attention.slice(0, 8)) {
			lines.push(`  ! ${item.message}`);
			if (item.context) lines.push(`    ${item.context}`);
		}
		if (presentation.attention.length > 8) lines.push("    · More review items and evidence references are retained in JSON.");
	}

	lines.push("", "What happened");
	if (presentation.runtime) pushRuntimeText(lines, presentation.runtime);
	pushActionFactsText(lines, presentation);
	pushSupportingText(lines, presentation.supporting);
	if (!presentation.runtime && !presentation.actionFacts?.available && presentation.supporting.length === 0) {
		lines.push("  No runtime summary was available.");
	}

	lines.push("", "Visibility", "  Inspected");
	if (presentation.inspected.length === 0) lines.push("    · No evidence surface was fully assessed.");
	else for (const item of presentation.inspected) lines.push(`    ✓ ${item}`);
	pushClassificationText(lines, presentation);
	if (presentation.visibility.length > 0) {
		lines.push("  Not fully visible");
		for (const item of presentation.visibility) lines.push(`    · ${item}`);
	}

	lines.push(
		"",
		"This is an evidence review, not a task-quality, authorization, or safety verdict.",
		"Private local metadata. Native entry references are retained for local drill-down.",
	);
	return lines.join("\n");
}

function identityStyle(_tone: AssuranceTone, text: string): string {
	return text;
}

/** Compact current-session widget. Styling is injected by the TUI host; plain strings remain usable elsewhere. */
export function renderAssuranceWidgetLines(
	report: AssuranceReport,
	registry: readonly AssuranceRule[],
	mode: AssurancePresentationMode,
	style: AssuranceStyler = identityStyle,
): string[] {
	const presentation = buildAssurancePresentation(report, registry, { mode });
	const lines: string[] = [style("accent", presentation.title)];
	if (presentation.attention.length === 0 && !presentation.assessmentIncomplete) {
		lines.push(style("success", "✓ Nothing needs review"));
	} else if (presentation.attention.length === 0) {
		lines.push(style("warning", "! Assessment incomplete"));
		lines.push(style("muted", "  No review items found in available evidence"));
	} else {
		lines.push(style("warning", `! ${presentation.attention.length} ${plural(presentation.attention.length, "item")} worth reviewing`));
		for (const item of presentation.attention.slice(0, 2)) {
			lines.push(style("warning", `  ! ${item.message}`));
			if (item.context) lines.push(style("muted", `    ${item.context}`));
		}
		if (presentation.attention.length > 2) lines.push(style("muted", `  · ${presentation.attention.length - 2} more in saved report`));
	}

	const runtime = presentation.runtime;
	if (runtime) {
		if (runtime.retainedTree) {
			lines.push(style("text", "Main session"));
			lines.push(style("text", `  Current path: ${runtime.activeEntries} retained entries`));
			lines.push(style("text", `  Other branches: ${runtime.offBranchEntries} retained entries`));
		} else {
			lines.push(style("text", `Main · ${runtime.activeEntries} active entries`));
		}
		for (const job of runtime.jobs.slice(0, 2)) {
			const marker = job.status === "failed" ? "✗" : "✓";
			const tone: AssuranceTone = job.status === "failed" ? "error" : "success";
			const branch = job.branch === "off-branch" ? " · off-branch" : "";
			lines.push(style(tone, `${marker} ${job.id} · ${job.status}${branch}`));
		}
	}

	const supportingCount = presentation.supporting.reduce((sum, item) => sum + item.count, 0);
	if (supportingCount > 0) {
		lines.push(style("muted", `${supportingCount} supporting ${plural(supportingCount, "observation")}`));
	}

	if (mode === "full" && runtime &&
		(runtime.retainedFactClassified > 0 || runtime.retainedFactUnclassified > 0)) {
		lines.push(style("dim",
			`Visibility · ${runtime.retainedFactClassified} classified · ${runtime.retainedFactUnclassified} unclassified`));
	}
	return lines.slice(0, 10);
}
