import type { ActionClassifier } from "../model";

export const webSearchActionClassifier: ActionClassifier = {
	meta: { id: "omp-kit.action.web-search", version: 1 },
	classify(call) {
		return call.toolName === "web_search"
			? [{ boundary: "external", operation: "read", resource: "service" }]
			: "not-applicable";
	},
};
