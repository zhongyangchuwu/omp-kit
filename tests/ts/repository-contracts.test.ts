import { describe, expect, test } from "bun:test";
import { dirname, join, relative, resolve } from "node:path";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

const ROOT = resolve(import.meta.dir, "../..");

function text(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function markdownSections(path: string): { metadata: Map<string, string>; body: string } {
  const content = text(path);
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  expect(match, `${path} must have YAML frontmatter`).not.toBeNull();
  const metadata = new Map<string, string>();
  for (const line of match![1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (field) metadata.set(field[1], field[2].trim());
  }
  return { metadata, body: match![2] };
}

function scalar(metadata: Map<string, string>, key: string): string | undefined {
  const raw = metadata.get(key);
  if (raw === undefined) return undefined;
  return raw.replace(/^(["'])(.*)\1$/, "$2");
}

function inlineList(raw: string | undefined): string[] {
  if (!raw) return [];
  const match = raw.match(/^\[(.*)\]$/);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((item) => item.trim().replace(/^(["'])(.*)\1$/, "$2"))
    .filter(Boolean);
}

function discoveredSkillPaths(): string[] {
  const root = join(ROOT, "skills");
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skills/${entry.name}/SKILL.md`)
    .filter((path) => existsSync(join(ROOT, path)))
    .sort();
}

function walkFiles(start: string): string[] {
  if (!existsSync(start)) return [];
  const output: string[] = [];
  for (const entry of readdirSync(start, { withFileTypes: true })) {
    const path = join(start, entry.name);
    if (entry.isDirectory()) output.push(...walkFiles(path));
    else output.push(path);
  }
  return output;
}

function markdownLinks(content: string): string[] {
  return [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
}

function localLinkTarget(sourcePath: string, target: string): string | undefined {
  const noFragment = target.split("#", 1)[0];
  if (!noFragment || /^(?:[a-z]+:|#)/i.test(noFragment)) return undefined;
  return resolve(dirname(sourcePath), decodeURIComponent(noFragment));
}

function supportTargets(content: string): string[] {
  return [...content.matchAll(/`((?:references|scripts|assets)\/[^`]+)`/g)].map((match) => match[1]);
}

function pathsWithSupportTargets(): string[] {
  return discoveredSkillPaths();
}

function yamlMetadataKeys(path: string): string[] {
  return [...markdownSections(path).metadata.keys()].sort();
}

test("native plugin manifest exposes resources and distributed knowledge", () => {
  const manifest = JSON.parse(text("package.json"));
  expect(manifest.omp).toBeTruthy();
  expect(manifest.files).toEqual(expect.arrayContaining(["agents", "rules", "skills", "extensions", "src", "docs", "evidence"]));
});

test("native agents are model-neutral, bounded and reference discovered skills", () => {
  const activeSkills = new Set(discoveredSkillPaths().map((path) => dirname(path).split(/[\\/]/).at(-1)!));
  const agentDir = join(ROOT, "agents");
  const paths = readdirSync(agentDir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  expect(paths).toHaveLength(4);

  for (const name of paths) {
    const path = `agents/${name}`;
    const { metadata } = markdownSections(path);
    expect(scalar(metadata, "name")).toBe(name.replace(/\.md$/, ""));
    expect(metadata.has("model")).toBe(false);
    expect(inlineList(metadata.get("tools")).length).toBeGreaterThan(0);
    expect(inlineList(metadata.get("spawns"))).toEqual([]);
    for (const skill of inlineList(metadata.get("autoloadSkills"))) expect(activeSkills.has(skill)).toBe(true);
  }
});

test("discovered skills are self-describing", () => {
  const skillPaths = discoveredSkillPaths();
  expect(skillPaths).toHaveLength(14);
  for (const path of skillPaths) {
    const { metadata, body } = markdownSections(path);
    const name = dirname(path).split(/[\\/]/).at(-1)!;
    expect(scalar(metadata, "name")).toBe(name);
    expect(scalar(metadata, "description")?.trim()).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  }
});

test("explicit document parser remains model-visible", () => {
  const { metadata } = markdownSections("skills/document-parser/SKILL.md");
  const description = scalar(metadata, "description")!;
  expect(description).toContain("explicit");
  expect(description).toContain("document");
});

test("main rule stays independent of retired config snapshot", () => {
  const body = text("rules/Main.md");
  expect(body).not.toContain("config.snapshot");
  expect(body).not.toContain("HARNESS-v2");
});

test("omp workflow references self-improvement policy", () => {
  expect(text("skills/omp-workflow/SKILL.md")).toContain("references/self-improvement.md");
});

test("current markdown relative links resolve", () => {
  const roots = ["README.md", "AGENTS.md", "docs"];
  const files = roots.flatMap((root) => {
    const path = join(ROOT, root);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });

  for (const path of files.filter((path) => path.endsWith(".md"))) {
    for (const target of markdownLinks(readFileSync(path, "utf8"))) {
      const resolved = localLinkTarget(path, target);
      if (!resolved) continue;
      expect(existsSync(resolved), `${relative(ROOT, path)} -> ${target}`).toBe(true);
    }
  }
});

test("skill entrypoint support references resolve", () => {
  for (const path of pathsWithSupportTargets()) {
    const dir = dirname(join(ROOT, path));
    for (const target of supportTargets(text(path))) {
      expect(existsSync(join(dir, target)), `${path} -> ${target}`).toBe(true);
    }
  }
});

test("support targets distinguish project docs from bundled docs", () => {
  for (const path of pathsWithSupportTargets()) {
    for (const target of supportTargets(text(path))) {
      expect(target.startsWith("docs/"), `${path} uses ambiguous bundled target ${target}`).toBe(false);
    }
  }
});

test("distributed design and experiment assets exist", () => {
  expect(existsSync(join(ROOT, "docs/design"))).toBe(true);
  expect(existsSync(join(ROOT, "evidence/experiments"))).toBe(true);
});

describe("skill-authoring repository contracts", () => {
  const skill = "skills/skill-authoring/SKILL.md";

  test("skill-authoring uses portable frontmatter only", () => {
    expect(yamlMetadataKeys(skill)).toEqual(["description", "name"]);
  });

  test("skill-authoring links all guides and templates", () => {
    const body = text(skill);
    for (const target of [
      "references/standard.md",
      "references/review.md",
      "references/maintenance.md",
      "references/evals.md",
      "references/omp-runtime.md",
      "assets/SKILL.template.md",
      "assets/evals.template.json",
      "assets/maintenance.template.md",
    ]) {
      expect(body).toContain(`\`${target}\``);
      expect(existsSync(join(ROOT, "skills/skill-authoring", target))).toBe(true);
    }
  });

  test("skill-authoring standard guide contains portable rules", () => {
    const body = text("skills/skill-authoring/references/standard.md");
    expect(body).toContain("name");
    expect(body).toContain("description");
    expect(body).toContain("references/");
  });

  test("runtime-specific skill-authoring terms stay isolated", () => {
    const paths = [skill, "skills/skill-authoring/references/standard.md", "skills/skill-authoring/references/review.md"];
    for (const path of paths) {
      expect(text(path)).not.toContain("autoloadSkills");
    }
    expect(text("skills/skill-authoring/references/omp-runtime.md")).toContain("autoloadSkills");
  });

  test("skill-authoring templates cover skill, evals and maintenance", () => {
    expect(text("skills/skill-authoring/assets/SKILL.template.md")).toContain("description:");
    expect(text("skills/skill-authoring/assets/evals.template.json")).toContain('"evals"');
    expect(text("skills/skill-authoring/assets/maintenance.template.md")).toContain("# Maintenance");
  });

  test("skill-authoring relative links resolve", () => {
    const dir = join(ROOT, "skills/skill-authoring");
    for (const path of walkFiles(dir).filter((path) => path.endsWith(".md"))) {
      for (const target of markdownLinks(readFileSync(path, "utf8"))) {
        const resolved = localLinkTarget(path, target);
        if (!resolved) continue;
        expect(existsSync(resolved), `${relative(ROOT, path)} -> ${target}`).toBe(true);
      }
    }
  });
});
