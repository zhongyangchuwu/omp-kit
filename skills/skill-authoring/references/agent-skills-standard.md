# Agent Skills Standard

Use this file for portable Agent Skills authoring rules. Runtime-specific behavior belongs in `references/runtimes/`.

## Required layout

A portable skill is a directory with a required `SKILL.md` file:

```text
skill-name/
  SKILL.md
  scripts/      optional executable code
  references/   optional long documentation
  assets/       optional templates and static resources
  evals/        optional evaluation cases
```

`name must match the parent directory`. Use one skill per directory. Avoid nested taxonomy unless the target runtime explicitly supports it.

## `SKILL.md` frontmatter

Use YAML frontmatter followed by Markdown instructions.

Minimal portable form:

```yaml
---
name: skill-name
description: Clear description of what the skill does and when to use it.
---
```

Rules:

- `name` uses lowercase letters, numbers, and hyphens.
- `name` does not start or end with a hyphen.
- `name` does not contain consecutive hyphens.
- `description` is non-empty and no longer than 1024 characters.
- `description` should include task intent and triggering context.

Most first versions should use only `name` and `description`. Optional standard fields exist, but adding them reduces portability in older runtimes.

## Body content

The Markdown body should tell the agent how to apply the skill:

- when to use it;
- when not to use it;
- workflow or decision process;
- examples;
- gotchas;
- validation checklist;
- when to read each support file.

Keep the body focused. If a section becomes long, move it to `references/` and link it from the main workflow.

## Progressive disclosure

The phrase progressive disclosure means the agent loads information in layers:

1. metadata: `name` and `description`;
2. main instructions: complete `SKILL.md` when activated;
3. resources: specific files in `references/`, `assets/`, or `scripts/` only when needed.

Design for this loading model. `SKILL.md` should act as a router and control panel. References should be focused, named clearly, and loaded only for the relevant task.

## Support directories

| Directory | Use when | Authoring rule |
| --- | --- | --- |
| `references/` | Long domain guidance, rubrics, API notes, detailed procedures | Tell the agent exactly when to read each file |
| `assets/` | Templates, schemas, static examples, starter files | Keep placeholders explicit and safe |
| `scripts/` | Deterministic repeated logic is more reliable as code | Scripts need `--help`, safe defaults, clear errors, and non-interactive input |
| `evals/` | Important skills need regression prompts and expected outcomes | Include realistic prompts, files, expected outputs, and assertions |

## File references

Use relative paths from the skill root in `SKILL.md` and support docs:

```markdown
Read `references/description-guide.md` when optimizing triggers from SKILL.md.
Use `assets/skill-template.md` when drafting a new skill from SKILL.md.
```

Avoid deep reference chains. A support file may point to one directly relevant sibling file, but the main `SKILL.md` should remain the navigation source.

## Validation

If available, run:

```bash
skills-ref validate ./skills/<skill-name>
```

This checks the structure and frontmatter. It does not prove the skill is useful, well-scoped, safe, or well-tested.

If the validator is unavailable, manually check:

- directory exists at the expected one-level skill path;
- `SKILL.md` starts with frontmatter;
- `name` follows the rules and matches the directory;
- `description` is specific and within limits;
- linked support files exist;
- templates do not include real secrets;
- runtime-specific assumptions are not mixed into portable guidance.
