import type { ScopeClassifier } from "./model";
import { fileToolScopeClassifier } from "./classifiers/file-tools";
import { githubToolScopeClassifier } from "./classifiers/github-tool";
import { webSearchScopeClassifier } from "./classifiers/web-search";

/** Tool names for which the built-in Scope V1 classifiers may require structured arguments. */
export const BUILTIN_SCOPE_TOOL_NAMES: ReadonlySet<string> = new Set([
	"read",
	"write",
	"grep",
	"glob",
	"edit",
	"apply_patch",
	"github",
	"web_search",
]);

/** Classifier availability is separate from assurance rule enablement. */
export const BUILTIN_SCOPE_CLASSIFIERS: readonly ScopeClassifier[] = Object.freeze([
	fileToolScopeClassifier,
	githubToolScopeClassifier,
	webSearchScopeClassifier,
].sort((a, b) => a.meta.id < b.meta.id ? -1 : a.meta.id > b.meta.id ? 1 : 0));
