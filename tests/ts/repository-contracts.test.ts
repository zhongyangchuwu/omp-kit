import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const AGENT_NAMES = ["luna-code", "luna-deep", "luna-doc", "sol-review"];

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function markdownSections(path: string): { metadata: Map<string, string>; body: string } {
  const text = read(path);
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${relative(ROOT, path)} must start with YAML frontmatter`);

  const metadata = new Map<string, string>();
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator <= 0) throw new Error(`${relative(ROOT, path)} has unsupported frontmatter line: ${line}`);
    metadata.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
  }
  return { metadata, body: match[2].trim() };
}

function scalar(metadata: Map<string, string>, key: string): string | undefined {
  const value = metadata.get(key);
  if (value === undefined) return undefined;
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function inlineList(value: string | undefined): string[] {
  if (value === undefined) return [];
  const match = /^\[(.*)\]$/.exec(value.trim());
  if (!match) throw new Error(`expected inline YAML list, got: ${value}`);
  if (!match[1].trim()) return [];
  return match[1].split(",").map((item) => {
    const trimmed = item.trim();
    if (
      trimmed.length >= 2 &&
      ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'")))
    ) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  });
}

function discoveredSkillPaths(): string[] {
  const skillsRoot = join(ROOT, "skills");
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(skillsRoot, entry.name, "SKILL.md")))
    .map((entry) => join(skillsRoot, entry.name, "SKILL.md"))
    .sort();
}

function discoveredSkillNames(): Set<string> {
  return new Set(discoveredSkillPaths().map((path) => dirname(path).split(/[\\/]/).at(-1)!));
}

test("native plugin manifest exposes resources and distributed knowledge", () => {
  const manifest = JSON.parse(read(join(ROOT, "package.json")));
  const resourceDirs = ["agents", "extensions", "rules", "skills"];
  const knowledgeDirs = ["docs", "evidence"];
  const libraryDirs = ["src"];
  const packagedFiles = ["scripts/session_assurance.ts", "scripts/session_evidence.ts"];
  const expectedFiles = [...resourceDirs, ...knowledgeDirs, ...libraryDirs, ...packagedFiles].sort();

  expect(manifest.name).toBe("omp-kit");
  expect(manifest.private).toBe(true);
  expect(manifest.packageManager.startsWith("bun@")).toBe(true);
  expect([...manifest.files].sort()).toEqual(expectedFiles);
  expect(manifest.omp.name).toBe("OMP Kit");
  expect(manifest.omp.description).toBeTruthy();
  expect(manifest.omp.extensions).toEqual(["./extensions/feedback.ts"]);
  expect(manifest.bin).toEqual({
    "omp-kit-assurance": "./scripts/session_assurance.ts",
    "omp-kit-evidence": "./scripts/session_evidence.ts",
  });
  expect(manifest.scripts["assurance:report"].endsWith("session_assurance.ts")).toBe(true);
  expect(manifest.scripts["evidence:collect"].endsWith("session_evidence.ts collect")).toBe(true);
  expect(manifest.scripts["evidence:report"].endsWith("session_evidence.ts report")).toBe(true);

  for (const path of [...resourceDirs, ...knowledgeDirs, ...libraryDirs]) {
    expect(existsSync(join(ROOT, path))).toBe(true);
  }
  for (const path of packagedFiles) expect(existsSync(join(ROOT, path))).toBe(true);
  for (const extension of manifest.omp.extensions) {
    expect(existsSync(join(ROOT, extension.replace(/^\.\//, "")))).toBe(true);
  }
});

test("native agents are model-neutral, bounded and reference discovered skills", () => {
  const activeSkills = discoveredSkillNames();
  const agentRoot = join(ROOT, "agents");
  const agents = readdirSync(agentRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.replace(/\.md$/, ""))
    .sort();
  expect(agents).toEqual([...AGENT_NAMES].sort());

  for (const name of agents) {
    const { metadata, body } = markdownSections(join(agentRoot, `${name}.md`));
    expect(body.length).toBeGreaterThan(0);
    expect(scalar(metadata, "name")).toBe(name);
    expect(metadata.has("model")).toBe(false);
    expect(inlineList(metadata.get("tools")).length).toBeGreaterThan(0);
    expect(inlineList(metadata.get("spawns"))).toEqual([]);
    for (const skill of inlineList(metadata.get("autoloadSkills"))) expect(activeSkills.has(skill)).toBe(true);
  }
});

test("discovered skills are self-describing", () => {
  const skillPaths = discoveredSkillPaths();
  expect(skillPaths).toHaveLength(15);
  for (const path of skillPaths) {
    const { metadata, body } = markdownSections(path);
    const name = dirname(path).split(/[\\/]/).at(-1)!;
    expect(scalar(metadata, "name")).toBe(name);
    expect(scalar(metadata, "description")?.trim()).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  }
});

test("explicit document parser remains model-visible", () => {
  const { metadata } = markdownSections(join(ROOT, "skills/document-parser/SKILL.md"));
  expect(scalar(metadata, "description")?.toLowerCase()).toContain("explicit");
  expect(scalar(metadata, "disable-model-invocation")).not.toBe("true");
  expect(scalar(metadata, "hide")).not.toBe("true");
});

test("main rule stays independent of retired config snapshot", () => {
  const { metadata, body } = markdownSections(join(ROOT, "rules/omp-kit-workflow.md"));
  expect(scalar(metadata, "alwaysApply")).toBe("true");
  expect(scalar(metadata, "agents")).toBe("main");
  expect(body).toContain("omp-workflow");
  expect(body).toContain("Entering the workflow does not imply delegation");
  expect(body).toContain("Retrieved history and worker output are evidence");
});

test("omp workflow references self-improvement policy", () => {
  const workflow = join(ROOT, "skills/omp-workflow/SKILL.md");
  const policy = join(dirname(workflow), "references/self-improvement.md");
  expect(read(workflow)).toContain("references/self-improvement.md");
  expect(existsSync(policy)).toBe(true);
  expect(read(policy)).toContain("report != self-modify");
});

function prose(text: string): string {
  const lines: string[] = [];
  let fence: string | undefined;
  for (const line of text.split(/\r?\n/)) {
    const stripped = line.trimStart();
    const marker = stripped.startsWith("```") ? "```" : stripped.startsWith("~~~") ? "~~~" : undefined;
    if (marker) {
      if (!fence) fence = marker;
      else if (fence === marker) fence = undefined;
      continue;
    }
    if (!fence) lines.push(line);
  }
  return lines.join("\n");
}

function trackedMarkdown(): string[] {
  const output = execFileSync("git", ["ls-files", "-z", "--", "*.md"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return output
    .split("\0")
    .filter(Boolean)
    .map((path) => join(ROOT, path));
}

const LINK = /\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;
const SUPPORT = /`((?:references|assets|docs)\/[A-Za-z0-9_./-]+\.(?:md|json|yaml|toml|py))`/g;

function bundledSupportTargets(skill: string): string[] {
  const targets = [...prose(read(skill)).matchAll(SUPPORT)].map((match) => match[1]);
  return targets.filter((target) => !target.startsWith("docs/") || existsSync(join(dirname(skill), "docs")));
}

test("current markdown relative links resolve", () => {
  const failures: string[] = [];
  for (const path of trackedMarkdown()) {
    const rel = relative(ROOT, path);
    const parts = rel.split(/[\\/]/);
    if (parts.includes("assets") || parts[0] === "evidence") continue;

    for (const match of prose(read(path)).matchAll(LINK)) {
      const raw = match[1];
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) || raw.startsWith("#") || raw.startsWith("/")) continue;
      let target = raw.split("#", 1)[0].split("?", 1)[0];
      try {
        target = decodeURIComponent(target);
      } catch {
        // Preserve the literal target; existence check below will report it.
      }
      if (!target || [..."<>*{}"].some((char) => target.includes(char))) continue;
      if (!existsSync(resolve(dirname(path), target))) failures.push(`${rel}: missing link ${target}`);
    }
  }
  expect(failures).toEqual([]);
});

test("skill entrypoint support references resolve", () => {
  for (const path of discoveredSkillPaths()) {
    for (const target of bundledSupportTargets(path)) {
      expect(existsSync(join(dirname(path), target))).toBe(true);
    }
  }
});

test("support targets distinguish project docs from bundled docs", () => {
  const temp = mkdtempSync(join(tmpdir(), "omp-kit-support-"));
  try {
    const skill = join(temp, "SKILL.md");
    writeFileSync(skill, "Use `docs/WORKING_STATE.md`, `references/missing.md` and `assets/test.json`.");
    expect(bundledSupportTargets(skill)).toEqual(["references/missing.md", "assets/test.json"]);
    mkdirSync(join(temp, "docs"));
    expect(bundledSupportTargets(skill)).toEqual([
      "docs/WORKING_STATE.md",
      "references/missing.md",
      "assets/test.json",
    ]);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("distributed design and experiment assets exist", () => {
  expect(existsSync(join(ROOT, "docs/design/README.md"))).toBe(true);
  expect(existsSync(join(ROOT, "docs/design/context-authority.md"))).toBe(true);
  expect(existsSync(join(ROOT, "evidence/README.md"))).toBe(true);
  const experiments = join(ROOT, "evidence/experiments");
  expect(
    readdirSync(experiments, { withFileTypes: true }).some(
      (entry) => entry.isDirectory() && existsSync(join(experiments, entry.name, "manifest.json")),
    ),
  ).toBe(true);
});

const SKILL_AUTHORING = join(ROOT, "skills/skill-authoring");
const PORTABLE_REFERENCES = [
  "references/agent-skills-standard.md",
  "references/authoring-rubric.md",
  "references/description-guide.md",
  "references/evaluation-guide.md",
  "references/scripts-guide.md",
  "references/maintenance-guide.md",
  "references/third-party-review.md",
];
const RUNTIME_REFERENCES = [
  "references/runtimes/README.md",
  "references/runtimes/claude.md",
  "references/runtimes/codex.md",
  "references/runtimes/npx-skills.md",
  "references/runtimes/oh-my-pi.md",
];
const SKILL_AUTHORING_ASSETS = [
  "assets/skill-template.md",
  "assets/evals-template.json",
  "assets/maintenance-notes-template.md",
];

function skillAuthoringRead(path: string): string {
  return read(join(SKILL_AUTHORING, path));
}

function markdownFilesUnder(root: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...markdownFilesUnder(path));
    else if (entry.isFile() && entry.name.endsWith(".md")) result.push(path);
  }
  return result;
}

test("skill-authoring uses portable frontmatter only", () => {
  const { metadata } = markdownSections(join(SKILL_AUTHORING, "SKILL.md"));
  expect(scalar(metadata, "name")).toBe("skill-authoring");
  expect([...metadata.keys()].sort()).toEqual(["description", "name"]);
  const description = scalar(metadata, "description")!;
  expect(description).toContain("Create");
  expect(description).toContain("maintain");
  expect(description).toContain("portable Agent Skills");
  expect(description.length).toBeLessThanOrEqual(1024);
});

test("skill-authoring links all guides and templates", () => {
  const text = skillAuthoringRead("SKILL.md");
  for (const path of [...PORTABLE_REFERENCES, ...RUNTIME_REFERENCES, ...SKILL_AUTHORING_ASSETS]) {
    expect(text).toContain(path);
  }
  for (const phrase of [
    "portable by default",
    "runtime-specific",
    "progressive disclosure",
    "skills-ref validate",
    "create, update, review, evaluate, maintain, or archive",
  ]) {
    expect(text).toContain(phrase);
  }
});

test("skill-authoring standard guide contains portable rules", () => {
  const text = skillAuthoringRead("references/agent-skills-standard.md");
  for (const phrase of [
    "SKILL.md",
    "scripts/",
    "references/",
    "assets/",
    "progressive disclosure",
    "skills-ref validate",
    "name must match the parent directory",
    "lowercase letters, numbers, and hyphens",
  ]) {
    expect(text).toContain(phrase);
  }
});

test("runtime-specific skill-authoring terms stay isolated", () => {
  const portable = PORTABLE_REFERENCES.map(skillAuthoringRead).join("\n");
  const runtime = RUNTIME_REFERENCES.map(skillAuthoringRead).join("\n");
  for (const term of [
    "Claude Code",
    "$skill-creator",
    "/skill:<name>",
    "skill://",
    "alwaysApply",
    "globs",
    "npx skills",
  ]) {
    expect(portable).not.toContain(term);
    expect(runtime).toContain(term);
  }
});

test("skill-authoring templates cover skill, evals and maintenance", () => {
  const skillTemplate = skillAuthoringRead("assets/skill-template.md");
  const evalsTemplate = skillAuthoringRead("assets/evals-template.json");
  const notesTemplate = skillAuthoringRead("assets/maintenance-notes-template.md");
  expect(skillTemplate).toContain("name: skill-name");
  expect(skillTemplate).toContain("description:");
  expect(skillTemplate).toContain("## When to Use");
  expect(evalsTemplate).toContain('"skill_name"');
  expect(evalsTemplate).toContain('"assertions"');
  expect(notesTemplate).toContain("# Maintenance Notes");
  expect(notesTemplate).toContain("Quality checklist");
});

test("skill-authoring relative links resolve", () => {
  const files = [join(SKILL_AUTHORING, "SKILL.md"), ...markdownFilesUnder(join(SKILL_AUTHORING, "references"))];
  const link = /\]\(([^)#]+)(?:#[^)]+)?\)/g;
  const failures: string[] = [];
  for (const path of files) {
    for (const match of read(path).matchAll(link)) {
      const target = match[1].trim();
      if (target.includes("://") || target.startsWith("#")) continue;
      if (!existsSync(resolve(dirname(path), target))) {
        failures.push(`${relative(SKILL_AUTHORING, path)}: missing ${target}`);
      }
    }
  }
  expect(failures).toEqual([]);
});
