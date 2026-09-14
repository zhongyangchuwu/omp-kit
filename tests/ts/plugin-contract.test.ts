import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const coreAgents = ["luna-code", "luna-deep", "luna-doc", "sol-review"];
const coreSkills = ["bounded-executor", "git-workflow", "omp-review", "omp-workflow"];
const workflowReferences = [
	"delegation.md",
	"execution.md",
	"project-state.md",
	"self-improvement.md",
	"subagent-context.md",
];

async function namesWithExtension(path: string, extension: string): Promise<string[]> {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && entry.name.endsWith(extension))
		.map((entry) => entry.name.slice(0, -extension.length))
		.sort();
}

async function fileNames(path: string): Promise<string[]> {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isFile())
		.map((entry) => entry.name)
		.sort();
}

async function directoryNames(path: string): Promise<string[]> {
	return (await readdir(path, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

async function text(path: string): Promise<string> {
	return readFile(join(root, path), "utf8");
}

describe("native plugin contract", () => {
	test("package exposes only current native roots", async () => {
		const manifest = JSON.parse(await text("package.json"));
		expect(manifest.name).toBe("omp-kit");
		expect(manifest.version).toBe("0.1.0");
		expect(manifest.private).toBe(true);
		expect(manifest.files).toEqual(["agents", "skills", "rules", "extensions", "scripts/session_evidence.ts"]);
		expect(manifest.omp.extensions).toEqual(["./extensions/feedback.ts"]);
		expect(manifest.bin).toEqual({ "omp-kit-evidence": "./scripts/session_evidence.ts" });
	});

	test("agent and skill surfaces are exact", async () => {
		expect(await namesWithExtension(join(root, "agents"), ".md")).toEqual(coreAgents);
		expect(await directoryNames(join(root, "skills"))).toEqual(coreSkills);

		for (const name of coreSkills) {
			const skill = await text(`skills/${name}/SKILL.md`);
			expect(skill).toContain(`name: ${name}`);
			expect(skill).toContain("description:");
		}
	});

	test("omp-workflow carries only current core references", async () => {
		expect(await fileNames(join(root, "skills", "omp-workflow", "references"))).toEqual(workflowReferences);
		const skill = await text("skills/omp-workflow/SKILL.md");
		for (const reference of workflowReferences) {
			expect(skill).toContain(`references/${reference}`);
		}
	});

	test("agents stay model-neutral and autoload only core skills", async () => {
		for (const name of coreAgents) {
			const agent = await text(`agents/${name}.md`);
			expect(agent).toContain(`name: ${name}`);
			expect(agent).toContain("spawns: []");
			expect(agent).not.toMatch(/^model:/m);
		}

		for (const name of ["luna-code", "luna-deep", "luna-doc"]) {
			expect(await text(`agents/${name}.md`)).toContain("autoloadSkills: [bounded-executor]");
		}
		expect(await text("agents/sol-review.md")).toContain("autoloadSkills: [omp-review]");
	});

	test("workflow rule remains Main-only", async () => {
		const rule = await text("rules/omp-kit-workflow.md");
		expect(rule).toContain("alwaysApply: true");
		expect(rule).toContain("agents: main");
		expect(rule).toContain("omp-workflow");
	});
});
