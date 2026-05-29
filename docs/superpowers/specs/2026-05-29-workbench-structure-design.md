# Workbench Structure Design

## Purpose

Upgrade this repository from a skills-only store into a Pi/OMP-ready personal agent workbench while preserving the existing active skills and staged imports.

## Scope

This phase creates the repository framework only:

- Add two project documents: runtime model notes and repository architecture.
- Add reserved top-level resource directories for future extensions, tools, packages, imports, localization, vendor mirrors, and MCP config examples.
- Simplify `registry.yaml` so it remains an index of record, not a policy database.
- Add Python maintenance scripts for registry validation, index rendering, static risk scanning, and future import/promotion entry points.
- Extend tests to cover the simplified registry model and new scripts.
- Update `README.md`, `justfile`, and `.gitignore` to reflect the new operating model.

This phase does not migrate existing skills, create real OMP extensions, create tools, create packages, install MCP servers, or implement real import/promotion file-moving logic.

## Resource Model

The repository separates agent assets by runtime responsibility:

- `skills/`: active file-backed skills linked into agent runtimes.
- `extensions/`: future OMP-native runtime extensions that register tools, commands, and hooks.
- `tools/`: future deterministic local CLIs/libraries used by extensions or humans.
- `packages/`: future Pi/OMP installable bundles that combine skills, extensions, prompts, themes, and supporting metadata.
- `incoming/`: quarantined third-party imports and draft skills that are not active.
- `vendor/`: future upstream mirrors or immutable source snapshots.
- `localized/`: future reviewed and adapted candidates before promotion.
- `mcp/`: future MCP server/config examples, with `mcp/configs/` reserved for portable config templates.
- `docs/`: project documentation.
- `scripts/`: repository maintenance automation.
- `tests/`: repository-level quality gates.

## Registry Model

`registry.yaml` remains the single index of record. It should answer only:

- What resource exists?
- Where is it?
- What status is it in?
- What risk class is it?

Detailed policy belongs beside the relevant resource:

- skill activation, descriptions, and workflow rules live in `SKILL.md` files and references;
- extension metadata will live in `extensions/<name>/package.json` or future extension-local metadata;
- tool metadata will live in tool-native files such as `pyproject.toml` or `package.json`;
- package metadata will live in package manifests;
- incoming review state stays in `incoming/REVIEW.md`.

The first simplified registry shape is:

```yaml
skills:
  name:
    status: active
    risk: low|medium|high
    path: skills/name
extensions: {}
tools: {}
packages: {}
incoming:
  name:
    status: staged
    risk: low|medium|high
    path: incoming/name
imports: {}
```

## Maintenance Scripts

Python is the scripting language for repository maintenance because the repository already uses `uv`, `pytest`, `pyyaml`, and `scripts/link_skills.py`.

Implemented now:

- `scripts/validate_registry.py`: validates top-level registry shape, required fields, path existence, risk/status values, active skill frontmatter name matching, and staged incoming isolation.
- `scripts/build_index.py`: prints a compact human-readable index from `registry.yaml` without generating a committed duplicate index file.
- `scripts/scan_risk.py`: scans a path for executable files, dependency manifests, and suspicious command/secrets/network indicators; findings are review evidence, not a failure gate.

Scaffolded now:

- `scripts/import_skill.py`: CLI placeholder for the future vendor/incoming import workflow.
- `scripts/promote_skill.py`: CLI placeholder for future localized-to-active promotion.

## Test Strategy

Tests validate behavior instead of current strings:

- registry parsing and shape;
- registry path references;
- active skill `SKILL.md` frontmatter name matching;
- staged imports staying out of `skills/`;
- `omp-superpowers` remaining explicit-only with nested upstream skills encapsulated under references;
- script behavior for registry validation, index rendering, and risk scanning;
- existing safe symlink behavior for `scripts/link_skills.py`.

## Completion Criteria

The work is complete when:

- the new directories exist and are tracked;
- the two requested docs exist;
- the simplified registry validates;
- README and justfile describe the new model;
- maintenance scripts have tests;
- `just test` passes.
