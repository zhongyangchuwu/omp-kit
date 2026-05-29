# Repository Architecture

## Goal

This repository is the canonical workbench for maintained personal agent capabilities. It should remain auditable, testable, installable, and reversible as it grows from skills into OMP extensions, deterministic tools, packages, and MCP integrations.

## Operating principles

- `registry.yaml` is the index of record, not a policy database.
- Active skills live only in `skills/`.
- Unreviewed third-party material lives in `incoming/` or `vendor/`, never directly in active runtime directories.
- Detailed constraints live with the resource they govern.
- Python maintenance scripts provide repository automation.
- Tests validate registry consistency, script behavior, and active skill safety invariants.
- Superpowers stays explicit-only; upstream nested Superpowers skills remain reference material, not active skills.

## Directory layout

```text
skills/          Active skills linked into agent runtimes.
extensions/      Reserved for OMP-native runtime extensions.
tools/           Reserved for deterministic local CLIs/libraries.
packages/        Reserved for Pi/OMP installable capability bundles.
incoming/        Quarantine and staging area for third-party or draft skills.
vendor/          Reserved for upstream mirrors, submodules, or immutable snapshots.
localized/       Reserved for reviewed/adapted candidates before promotion.
mcp/             Reserved for MCP servers and portable config templates.
mcp/configs/     Reserved for example MCP config files without secrets.
docs/            Project documentation.
scripts/         Repository maintenance automation.
tests/           Repository-level tests.
registry.yaml    Canonical resource index.
justfile         Common maintenance entry points.
```

Empty framework directories are tracked with `.gitkeep` until real resources exist.

## Resource boundaries

### Skills

Skills are model-readable workflow and reference packs:

```text
skills/<name>/SKILL.md
```

Use skills for activation guidance, task workflows, decision rules, tool selection, safety notes, and references. Do not make a skill carry complex execution semantics on its own.

### Extensions

Extensions are future OMP runtime integrations. They should expose custom tools, commands, hooks, or interceptors. Extension-local metadata should live in the extension directory, not in `registry.yaml`.

### Tools

Tools are deterministic implementations. They should be testable without the model and should return structured output when called by an extension.

### Packages

Packages are future installable bundles. A package may combine skills, extensions, prompts, themes, and metadata into one opt-in unit.

### Incoming, vendor, and localized

Third-party intake should flow through isolation stages:

```text
vendor/ or incoming/ -> review -> localized/ -> active resource directory -> registry.yaml
```

`incoming/` is for staged material under review. `vendor/` is for preserving upstream source snapshots. `localized/` is for reviewed and adapted candidates not yet promoted.

## Registry model

`registry.yaml` answers four questions:

- What resource exists?
- Where is it?
- What status is it in?
- What risk class is it?

Minimal entry shape:

```yaml
skills:
  name:
    status: active
    risk: low
    path: skills/name
```

Allowed top-level resource groups:

```text
skills
extensions
tools
packages
incoming
imports
```

Required fields for each entry:

```text
path
status
risk
```

Detailed policy belongs beside the resource:

- skill behavior: `SKILL.md` and references;
- extension behavior: extension-local metadata;
- tool behavior: tool-native config such as `pyproject.toml` or `package.json`;
- package behavior: package manifest;
- staged review details: `incoming/REVIEW.md`.

## Maintenance scripts

```text
scripts/link_skills.py        Links active skills into ~/.agents/skills.
scripts/validate_registry.py  Validates registry shape and referenced paths.
scripts/build_index.py        Prints a compact index from registry.yaml.
scripts/scan_risk.py          Scans a directory for review-worthy risk indicators.
scripts/import_skill.py       Placeholder for future import workflow.
scripts/promote_skill.py      Placeholder for future promotion workflow.
```

Scaffolded scripts must fail explicitly with a clear message rather than silently doing nothing.

## Testing strategy

Repository tests cover:

- registry YAML parseability;
- allowed registry groups;
- required entry fields;
- resource path existence;
- active skill frontmatter name matching;
- incoming entries staying out of active `skills/`;
- `omp-superpowers` explicit-only and nested-skill encapsulation invariants;
- maintenance script behavior;
- safe skill-linking behavior.

`just test` is the fast gate for repository changes.

## Future upgrade path

The next upgrade phases should be incremental:

1. Promote `autodl` into the first full high-risk package: skill + extension + tool + package.
2. Upgrade `skill-authoring` into the maintenance center for registry validation, risk scanning, and promotion workflows.
3. Add OMP extension linking only after real extensions exist and their loading convention is validated.
4. Add import and promotion implementation only after the first reviewed third-party candidate exercises the full path.
5. Add detailed operation guides after the framework stabilizes.

The long-term target is a personal agent workbench: a tested local capability system rather than a loose collection of prompts and scripts.
