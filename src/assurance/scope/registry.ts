import type { ActionClassifier } from "./model";
import { fileToolActionClassifier } from "./classifiers/file-tools";
import { githubToolActionClassifier } from "./classifiers/github-tool";
import { webSearchActionClassifier } from "./classifiers/web-search";

/** Tool names for which built-in action-fact classifiers may require structured arguments. */
export const BUILTIN_ACTION_TOOL_NAMES: ReadonlySet<string> = new Set([
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
export const BUILTIN_ACTION_CLASSIFIERS: readonly ActionClassifier[] = Object.freeze([
	fileToolActionClassifier,
	githubToolActionClassifier,
	webSearchActionClassifier,
].sort((a, b) => a.meta.id < b.meta.id ? -1 : a.meta.id > b.meta.id ? 1 : 0));
