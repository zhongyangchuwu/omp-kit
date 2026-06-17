# Repository Guidelines

## Project Overview

OMP Kit is an Oh My Pi skill kit: a maintained collection of agent skills plus Python automation for validating, indexing, promoting, and installing them. The repository should stay auditable: resource metadata is explicit, generated files are checked, and active skills are linked into the OMP runtime from `skills/`.

## Architecture & Data Flow

- `resource.yaml` is the source of truth for each maintained resource. It records source provenance, risk, activation policy, verification, maintenance, and relationships.
- `registry.yaml` is a generated index only. It contains `{status, risk, path}` for `skills:` and `drafts:` and must be regenerated with `scripts/build_registry.py`, not hand-edited.
- Resource lifecycle:
  ```text
  references/ -> review/extract -> drafts/<name> -> skills/<name> -> registry.yaml -> ~/.omp/agent/skills/<name>
  ```
- Active skills live only in `skills/<name>/`; draft skills live only in `drafts/<name>/`; local upstream material lives in gitignored `references/`.
- Core metadata flow:
  - `scripts/resource_metadata.py` discovers `skills/*/resource.yaml` and `drafts/*/resource.yaml`.
  - It validates each file against `schemas/resource.schema.yaml` using JSON Schema Draft 2020-12.
  - It enforces invariants: kebab-case names, directory/name match, valid status/risk/activation enums, path/status/location coherence.
  - `scripts/build_registry.py` formats the generated registry and writes or checks `registry.yaml`.
  - `scripts/validate_registry.py` checks committed registry structure, path existence, SKILL.md frontmatter, and generated-registry drift.
- Runtime installation flow: `scripts/link_skills.py` symlinks active `skills/*` directories into `~/.omp/agent/skills/` or `$AGENT_ROOT/skills/`.

## Key Directories

- `skills/` — Active OMP skills. Each active skill needs `SKILL.md` and `resource.yaml`; optional `references/`, `assets/`, `examples/`, `tests/`, or source files are resource-local.
- `drafts/` — Inactive skill work before promotion. Drafts appear in `registry.yaml` under `drafts:` but are not installed.
- `scripts/` — Repository maintenance automation. Python scripts for registry generation, validation, linking, promotion, risk scanning, and reference maintenance.
- `schemas/` — Metadata schemas, currently `schemas/resource.schema.yaml`.
- `tests/` — Root pytest suite for registry, metadata, promotion, linking, and script behavior.
- `docs/` — Durable repository design and workflow guidance. Put project facts here, not inside reusable skills.
- `registry.yaml` — Generated resource index. Do not edit manually.

## Development Commands

Use `just` as the command entry point and `uv` as the Python runner/package manager.

```bash
just install             # symlink active skills into ~/.omp/agent/skills/
just install-force       # replace stale skill symlinks and prune removed links
just build-registry      # regenerate registry.yaml from resource.yaml files
just check-registry      # fail if registry.yaml is stale
just validate-registry   # validate registry structure and active SKILL.md frontmatter
just build-index         # print compact registry index
just scan-risk <path>    # scan a path for risky files/patterns
just promote-skill drafts/<name> --name <name> --activation automatic --risk low
just test                # run root test suite: uv run python -m pytest tests
just pull-references     # git pull --ff-only for reference repos under references/
just init-reference-docs # create missing reference docs from git metadata
```

Direct equivalents are Python scripts under `scripts/`, e.g. `uv run python scripts/build_registry.py --check`.

## Code Conventions & Common Patterns

- Python target: `>=3.12`; use `from __future__ import annotations` in scripts and tests.
- Prefer `pathlib.Path` for filesystem work. Keep paths repo-relative in persisted metadata.
- Keep scripts importable and CLI-friendly:
  - shared logic in functions;
  - `main() -> int` for command entry points;
  - direct-execution import fallback when a script imports another script module.
- Use dataclasses for structured validation results, usually frozen, with a `.format()` helper for user-facing issue text.
- Return lists of issues from validators instead of raising for normal validation failures; raise custom exceptions for malformed workflow state or unsafe operations.
- Use explicit allowed-value constants (`ALLOWED_RISKS`, `ALLOWED_STATUSES`, `ALLOWED_ACTIVATION_MODES`) and keep tests aligned with them.
- YAML is read/written with `yaml.safe_load`/`safe_dump` patterns. Registry output should remain minimal and deterministic.
- Skill naming is kebab-case. `SKILL.md` frontmatter `name` must match the directory and registry key.
- Do not duplicate durable guidance across skills. A skill owns one domain; project-specific facts belong in `docs/`.
- Do not add compatibility shims or alternate metadata conventions. Existing convention is `resource.yaml` per resource plus generated `registry.yaml`.

## Important Files

- `pyproject.toml` — Project metadata, Python `>=3.12`, runtime/test dependencies (`jsonschema`, `pyyaml`, `pytest`, document helpers).
- `justfile` — Canonical development and maintenance commands.
- `registry.yaml` — Generated active/draft resource index.
- `schemas/resource.schema.yaml` — JSON Schema for every `resource.yaml`.
- `scripts/resource_metadata.py` — Core metadata library: discovery, schema validation, invariant checks, registry generation, resource copy helpers.
- `scripts/build_registry.py` — Registry generation/check CLI.
- `scripts/validate_registry.py` — Registry and active skill validation CLI.
- `scripts/link_skills.py` — Runtime installation via symlinks.
- `scripts/promote_skill.py` — Safe draft-to-active promotion workflow.
- `scripts/scan_risk.py` — Static risk scanner for imported/reference material.
- `docs/architecture.md` — Repository design principles and data model.
- `docs/workflows.md` — Daily operation workflows and commit checklist.
- `docs/resource-model.md` — Full `resource.yaml` field reference.
- `docs/skill-design.md` — Skill scope, SKILL.md shape, and support-file rules.

## Runtime/Tooling Preferences

- Use Python 3.12+.
- Use `uv run ...` for Python execution; do not assume a globally installed pytest or package environment.
- Use `just` recipes for routine repository workflows.
- Use `pytest` for tests. There is no top-level tox, no CI config, and no dedicated lint command in this repository.
- Use JSON Schema Draft 2020-12 semantics for resource metadata.
- Keep `registry.yaml` generated. After adding, removing, renaming, promoting, or changing resource metadata, run `just build-registry`.
- Skill installation targets OMP's native user config: `~/.omp/agent/skills/` by default, or `$AGENT_ROOT/skills/` when `AGENT_ROOT` is set.

## Testing & QA

- Root tests run with:
  ```bash
  just test
  ```
  This executes `uv run python -m pytest tests`.
- Root pytest coverage focuses on:
  - resource schema validity;
  - `resource.yaml` validation;
  - generated `registry.yaml` equality;
  - active SKILL.md frontmatter consistency;
  - promotion/linking safety;
  - script behavior and risk scanning.
- Test style:
  - plain `assert` and `pytest.raises`;
  - `tmp_path` for filesystem isolation;
  - monkeypatch subprocess/network boundaries when needed;
  - assert behavior and safety invariants, not incidental formatting unless the generated artifact contract depends on it.
- Skill-local tests may have their own project config. Example: `skills/autodl/` has its own `pyproject.toml` and tests using `pytest-httpx` and Typer `CliRunner`; root `just test` does not run those skill-local tests.
- Before committing repository-level changes, run:
  ```bash
  just test
  git diff --check
  ```
