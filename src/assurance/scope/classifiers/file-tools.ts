import type { ActionClassifier, ActionDescriptor, ActionToolCall } from "../model";
import { classifyPathTarget } from "../path";

function dedupe(values: readonly ActionDescriptor[]): readonly ActionDescriptor[] {
	const byKey = new Map(values.map(value => [`${value.boundary}\u0000${value.operation}\u0000${value.resource}`, value]));
	return [...byKey.values()];
}

function onePath(call: ActionToolCall, operation: "read" | "write", pathValue: unknown,
	workspaceRoot: string | null, homeDir: string | null): readonly ActionDescriptor[] | "not-applicable" {
	if (typeof pathValue !== "string") return "not-applicable";
	// OMP supports delimiter recovery for search tools. Do not reproduce that filesystem-dependent parser here.
	if ((call.toolName === "grep" || call.toolName === "glob") && pathValue.includes(";")) return "not-applicable";
	const result = classifyPathTarget(pathValue, operation, workspaceRoot, homeDir);
	return result ? [result] : "not-applicable";
}

function hashlineEditTargets(input: string, workspaceRoot: string | null, homeDir: string | null): readonly ActionDescriptor[] {
	const out: ActionDescriptor[] = [];
	const header = /^\[([^\]\r\n]+)#[0-9A-F]{4}\]\s*$/gm;
	for (const match of input.matchAll(header)) {
		const value = classifyPathTarget(match[1], "write", workspaceRoot, homeDir);
		if (value) out.push(value);
	}
	return dedupe(out);
}

/** Built-in file/search contracts only. It does not inspect generic shell or eval code. */
export const fileToolActionClassifier: ActionClassifier = {
	meta: { id: "omp-kit.action.file-tools", version: 1 },
	classify(call, context) {
		if (call.toolName === "read") {
			return onePath(call, "read", call.arguments.path, context.workspaceRoot, context.homeDir);
		}
		if (call.toolName === "write") {
			return onePath(call, "write", call.arguments.path, context.workspaceRoot, context.homeDir);
		}
		if (call.toolName === "grep" || call.toolName === "glob") {
			const value = call.arguments.path === undefined || call.arguments.path === "" ? "." : call.arguments.path;
			return onePath(call, "read", value, context.workspaceRoot, context.homeDir);
		}
		if (call.toolName === "edit" || call.toolName === "apply_patch") {
			if (typeof call.arguments.input !== "string") return "not-applicable";
			const facts = hashlineEditTargets(call.arguments.input, context.workspaceRoot, context.homeDir);
			return facts.length ? facts : "not-applicable";
		}
		return "not-applicable";
	},
};
