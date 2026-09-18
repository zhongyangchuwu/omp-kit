import type { ActionClassifier, ActionDescriptor } from "../model";

const READ_OPS = new Set(["repo_view", "file_read", "search_issues", "search_prs", "search_code", "search_commits", "search_repos", "run_watch"]);

export const githubToolActionClassifier: ActionClassifier = {
	meta: { id: "omp-kit.action.github-tool", version: 1 },
	classify(call) {
		if (call.toolName !== "github" || typeof call.arguments.op !== "string") return "not-applicable";
		const op = call.arguments.op;
		if (READ_OPS.has(op)) return [{ boundary: "external", operation: "read", resource: "service" }];
		if (op === "pr_create") return [{ boundary: "external", operation: "write", resource: "service" }];
		if (op === "pr_push") return [{ boundary: "external", operation: "write", resource: "version-control" }];
		if (op === "pr_checkout") {
			const values: ActionDescriptor[] = [
				{ boundary: "external", operation: "read", resource: "service" },
				{ boundary: "host-user", operation: "write", resource: "filesystem" },
			];
			return values;
		}
		return "not-applicable";
	},
};
