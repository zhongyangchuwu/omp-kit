import type { ScopeClassifier } from "../model";

export const webSearchScopeClassifier: ScopeClassifier = {
	meta: { id: "omp-kit.scope.web-search", version: 1 },
	classify(call) {
		return call.toolName === "web_search"
			? [{ boundary: "external", access: "read", resource: "service" }]
			: "not-applicable";
	},
};
