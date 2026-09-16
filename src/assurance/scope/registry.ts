import type { ScopeClassifier } from "./model";
import { fileToolScopeClassifier } from "./classifiers/file-tools";
import { githubToolScopeClassifier } from "./classifiers/github-tool";
import { webSearchScopeClassifier } from "./classifiers/web-search";

/** Classifier availability is separate from assurance rule enablement. */
export const BUILTIN_SCOPE_CLASSIFIERS: readonly ScopeClassifier[] = Object.freeze([
	fileToolScopeClassifier,
	githubToolScopeClassifier,
	webSearchScopeClassifier,
].sort((a, b) => a.meta.id < b.meta.id ? -1 : a.meta.id > b.meta.id ? 1 : 0));
