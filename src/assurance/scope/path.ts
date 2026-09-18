import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ActionDescriptor, OperationType, ScopeBoundary } from "./model";

const EXTERNAL_READ_SCHEMES = new Set(["http:", "https:", "ssh:", "issue:", "pr:"]);
const INTERNAL_SCHEMES = new Set(["agent:", "artifact:", "history:", "local:", "xd:", "conflict:", "memory:", "omp:"]);

function isWithin(root: string, candidate: string): boolean {
	const rel = path.relative(path.resolve(root), path.resolve(candidate));
	return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function classifyAbsolutePath(candidate: string, workspaceRoot: string | null, homeDir: string | null): ScopeBoundary {
	if (workspaceRoot && isWithin(workspaceRoot, candidate)) return "workspace";
	if (homeDir && isWithin(homeDir, candidate)) return "host-user";
	const normalized = path.resolve(candidate);
	const systemRoots = process.platform === "win32"
		? ["C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)"]
		: ["/etc", "/usr", "/var/lib", "/opt", "/Library", "/System"];
	if (systemRoots.some(root => isWithin(root, normalized))) return "host-system";
	return "unknown";
}

function relativeBoundary(value: string, workspaceRoot: string | null, homeDir: string | null): ScopeBoundary {
	if (workspaceRoot) return classifyAbsolutePath(path.resolve(workspaceRoot, value), workspaceRoot, homeDir);
	const normalized = path.normalize(value);
	if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) return "unknown";
	return "workspace";
}

export function classifyPathTarget(
	raw: string,
	operation: Extract<OperationType, "read" | "write">,
	workspaceRoot: string | null,
	homeDir: string | null,
): ActionDescriptor | null {
	const value = raw.trim();
	if (!value) return null;
	// OMP accepts collapsed http(s):/host URL spellings. A bare www.* token is
	// filesystem-dependent (a same-named local path can win), so leave it unclassified.
	if (/^www\./i.test(value)) return null;
	if (/^https?:\/[^/]/i.test(value)) {
		return operation === "read" ? { boundary: "external", operation, resource: "network" } : null;
	}
	const scheme = /^([A-Za-z][A-Za-z0-9+.-]*):\/\//.exec(value)?.[1]?.toLowerCase();
	if (scheme) {
		const protocol = `${scheme}:`;
		if (EXTERNAL_READ_SCHEMES.has(protocol)) {
			return { boundary: "external", operation, resource: scheme === "http" || scheme === "https" || scheme === "ssh" ? "network" : "service" };
		}
		if (protocol === "file:") {
			try {
				const local = fileURLToPath(value);
				return { boundary: classifyAbsolutePath(local, workspaceRoot, homeDir), operation, resource: "filesystem" };
			} catch {
				return null;
			}
		}
		if (INTERNAL_SCHEMES.has(protocol)) return null;
		return null;
	}
	if (value.startsWith("~")) {
		if (!homeDir) return { boundary: "unknown", operation, resource: "filesystem" };
		const expanded = value === "~" ? homeDir : value.startsWith("~/") || value.startsWith("~\\")
			? path.join(homeDir, value.slice(2)) : null;
		return expanded
			? { boundary: classifyAbsolutePath(expanded, workspaceRoot, homeDir), operation, resource: "filesystem" }
			: { boundary: "unknown", operation, resource: "filesystem" };
	}
	if (!path.isAbsolute(value)) return { boundary: relativeBoundary(value, workspaceRoot, homeDir), operation, resource: "filesystem" };
	return { boundary: classifyAbsolutePath(value, workspaceRoot, homeDir), operation, resource: "filesystem" };
}
