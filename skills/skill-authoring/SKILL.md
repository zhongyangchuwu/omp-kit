---
name: skill-authoring
description: Create, review, refactor, evaluate, update, and maintain portable Agent Skills that use SKILL.md with standard frontmatter, references, assets, scripts, examples, evals, and compatibility checks. Use when designing a new skill, improving an existing skill, optimizing a skill description, splitting references, deciding whether scripts are needed, reviewing third-party skills, or maintaining a personal skill library.
---

# Skill Authoring

## Overview

Use this skill for the full Agent Skills authoring lifecycle: create, update, review, evaluate, maintain, or archive `SKILL.md`-based skills. Default to portable by default: use the open Agent Skills structure first, and treat runtime-specific behavior as optional environment notes.

Core principle: `SKILL.md` is a control panel, not an encyclopedia. Put core workflow in the main file, long guidance in `references/`, reusable templates in `assets/`, and deterministic logic in `scripts/` only when needed.

## Workflow

1. Identify the lifecycle task: new skill, existing skill update, description optimization, eval work, script decision, third-party review, or library maintenance.
2. Read source material first: user notes, current `SKILL.md`, project docs, runbooks, real failures, examples, and existing conventions.
3. Define the skill boundary: what it does, when to use it, when not to use it, expected inputs, outputs, edge cases, and success criteria.
4. Choose structure with progressive disclosure: keep `SKILL.md` concise and link focused references only when needed.
5. Keep compatibility clean: generated portable skills should use standard frontmatter and relative file references; do not mix runtime-specific guidance into portable files.
6. Add examples, gotchas, evals, maintenance notes, and scripts only when they add clear reusable value.
7. Validate before completion: check names, frontmatter, links, template paths, and any available validator output.

## Reference Routing

| Need | Read |
| --- | --- |
| Agent Skills format, directories, frontmatter, validation | [agent-skills-standard.md](references/agent-skills-standard.md) |
| Quality rubric for creating, updating, or reviewing a skill | [authoring-rubric.md](references/authoring-rubric.md) |
| Improve triggering and `description` wording | [description-guide.md](references/description-guide.md) |
| Add evals or compare skill behavior across versions | [evaluation-guide.md](references/evaluation-guide.md) |
| Decide whether a skill needs scripts | [scripts-guide.md](references/scripts-guide.md) |
| Maintain a personal skill library over time | [maintenance-guide.md](references/maintenance-guide.md) |
| Review a downloaded or third-party skill | [third-party-review.md](references/third-party-review.md) |
| Define resource-local metadata | [resource-metadata.md](references/resource-metadata.md) |
| Generate and validate `registry.yaml` | [registry-generation.md](references/registry-generation.md) |
| Runtime-specific notes; optional and non-portable | [runtimes/README.md](references/runtimes/README.md) |
| Claude runtime notes | [runtimes/claude.md](references/runtimes/claude.md) |
| Codex runtime notes | [runtimes/codex.md](references/runtimes/codex.md) |
| npx skills CLI notes | [runtimes/npx-skills.md](references/runtimes/npx-skills.md) |
| oh-my-pi runtime notes | [runtimes/oh-my-pi.md](references/runtimes/oh-my-pi.md) |
| Portable skill starter template | [skill-template.md](assets/skill-template.md) |
| Resource metadata template | [resource-template.yaml](assets/resource-template.yaml) |
| Eval file template | [evals-template.json](assets/evals-template.json) |
| Maintenance notes template | [maintenance-notes-template.md](assets/maintenance-notes-template.md) |

## Compatibility Rules

- Portable first: write only standard Agent Skills fields unless the user explicitly targets one runtime.
- Do not generate runtime-specific fields by default.
- Do not treat runtime-specific tools as required for authoring.
- Keep third-party agent information under `references/runtimes/`.
- Use relative paths from the skill root for references and assets.
- Prefer references over large `SKILL.md` bodies; prefer assets for templates; prefer scripts only for deterministic repeated work.

## Validation

If available, run:

```bash
skills-ref validate ./skills/<skill-name>
```

If it is unavailable, manually verify:

- directory name matches `name`;
- `name` uses lowercase letters, numbers, and hyphens;
- `description` is non-empty, specific, and under 1024 characters;
- generated frontmatter contains no non-portable fields unless explicitly requested;
- referenced files exist;
- examples and templates do not contain real secrets;
- evals or maintenance notes exist for important skills.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Treating a skill as a long prompt dump | Keep `SKILL.md` concise; split details into focused references |
| Writing from generic best practices only | Ground the skill in real tasks, project artifacts, failures, and user corrections |
| Over-broad description | Add should-trigger and should-not-trigger examples; narrow the boundary |
| Mixing runtime notes with portable rules | Move runtime notes to `references/runtimes/` |
| Adding scripts for judgment calls | Use scripts only for deterministic, repeated, testable work |
| Installing third-party skills directly into active scan paths | Review them as supply-chain inputs first |
