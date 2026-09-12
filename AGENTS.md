# Repository Guidelines

## Project Overview

OMP Kit is a personal Oh My Pi harness. It maintains portable runtime/model configuration, custom task agents, reusable skills, and Python automation for installing, validating, indexing, and promoting those resources.

The repository is the source of truth for tracked harness state. Runtime state under `~/.omp/agent/` is deployed from this repository and may drift; installation detects that drift instead of silently overwriting it.

## Architecture & Data Flow

Harness layers:

```text
config/   -> model/runtime routing
agents/   -> task-specific worker harnesses
skills/   -> reusable procedures and references
docs/     -> durable project/harness facts
scripts/  -> installation and maintenance automation
```

Skill metadata remains intentionally separate:

- `resource.yaml` is the source of truth for each maintained skill/draft.
- `registry.yaml` is a generated index only and must match resource metadata.
- Resource lifecycle:
  ```text
  references/ -> review/extract -> drafts/<name> -> skills/<name> -> registry.yaml
  ```

Runtime installation:

- `scripts/install_harness.py` installs the complete tracked harness.
- active `skills/*` are symlinked individually into `~/.omp/agent/skills/`;
- `agents/*.md` are symlinked individually into `~/.omp/agent/agents/`;
- `config/config.yml` is copied to `~/.omp/agent/config.yml`;
- `config/models.yml` is copied to `~/.omp/agent/models.yml`;
- differing runtime config is never overwritten without `--force`; forced replacement creates timestamped backups;
- unmanaged real agent/skill files are never replaced by force.

## Harness v2 Design

Read `docs/HARNESS_V2_GUIDE.md` before changing model routing, orchestration, worker context policy, or context management.

Current conceptual architecture:

```text
Human
  -> Sol director / control plane
      -> Luna High routine workers
      -> Luna Max difficult bounded workers
      -> Sol High selective high-risk review
```

Important boundaries:

- director: user intent, decomposition, interfaces, acceptance criteria, escalation, integration;
- workers: scoped repository exploration, implementation, local debugging, focused verification;
- `omp-workflow`: delegation, persistence, context transfer, escalation, gates;
- `bounded-executor`: scope discipline, repair budget, verification, stop conditions;
- config: role-to-model mapping;
- project docs/rules: repository-specific facts.

Prefer pull-based worker context. If a task depends on parent discussion, the worker can read `history://<parent-agent-id>` rather than requiring the director to rewrite the full conversation. Conversation is evidence, not automatically a specification.

## Key Directories

- `config/` — canonical portable OMP `config.yml` and `models.yml`; never commit secrets.
- `agents/` — custom OMP task agents. Keep tool surfaces task-specific and small.
- `skills/` — active OMP skills. Each active skill needs `SKILL.md` and `resource.yaml`.
- `drafts/` — inactive skill work before promotion.
- `scripts/` — repository maintenance and installation automation.
- `schemas/` — skill resource metadata schema.
- `tests/` — root pytest suite.
- `docs/` — durable harness and repository design guidance.
- `registry.yaml` — generated skill/draft index; do not hand-maintain as policy.

## Development Commands

Use `just` as the command entry point and `uv` as the Python runner/package manager.

```bash
just install             # install complete harness; refuse differing runtime config
just install-force       # backup and replace differing runtime config
just install-skills      # legacy skill-only linking path
just build-registry      # regenerate registry.yaml from resource.yaml files
just check-registry      # fail if registry.yaml is stale
just validate-registry   # validate registry structure and active SKILL.md frontmatter
just build-index         # print compact registry index
just scan-risk <path>    # scan a path for risky files/patterns
just promote-skill drafts/<name> --name <name> --activation automatic --risk low
just test                # uv run python -m pytest tests
just pull-references
just init-reference-docs
```

Before committing repository-level changes, run:

```bash
just build-registry
just test
git diff --check
```

If config or model routing changed, also install into a disposable/test agent root or inspect the effective OMP configuration before replacing the live runtime.

## Code Conventions

- Python target: `>=3.12`.
- Use `from __future__ import annotations` in scripts and tests.
- Prefer `pathlib.Path`.
- Keep scripts importable and CLI-friendly: shared logic in functions and `main() -> int` for command entry points.
- Use explicit custom exceptions for unsafe workflow state; normal validators should return issues where appropriate.
- Use YAML safe-load/safe-dump patterns and deterministic generated output.
- Keep persisted repository paths relative where practical.
- Do not introduce compatibility layers or templating systems without a concrete requirement.

## Configuration Rules

- `config/config.yml` contains portable OMP settings and semantic role routing.
- `config/models.yml` may contain endpoint/model metadata and command-resolved secret references, but never literal bearer/API secrets.
- Current CPA credentials resolve from `CLIPROXYAPI_API_KEY` through the tracked command-resolved secret entry.
- If the CPA host/port intentionally differs from the tracked local default, change the canonical repository config rather than making an undocumented runtime edit.
- OMP may write runtime `config.yml`; do not symlink tracked config directly. Use the installer and treat runtime mutations as drift to review.

## Agent Rules

- Agent definitions live in `agents/*.md`.
- Prefer role aliases (`@fast_worker`, `@good_worker`, `@review`) over hard-coding model names in agent prompts.
- Restrict tools to the task shape. Do not give a documentation worker bash/MCP/subagent tools without a reason.
- High-effort implementation agents should autoload `bounded-executor` or obey equivalent bounded execution rules.
- Reuse persistent workers for the same coherent workstream instead of repeatedly spawning agents that must rediscover context.

## Skill Rules

- Skill naming is kebab-case; `SKILL.md` frontmatter `name` must match the directory and registry key.
- One skill owns one stable concern.
- `SKILL.md` is a control panel; long/detail guidance belongs in `references/`.
- Do not duplicate durable guidance across skills.
- Project-specific facts belong in `docs/` or project-local rules, not reusable skills.
- `registry.yaml` is generated from `resource.yaml` and should be regenerated after skill metadata changes.

## Testing & QA

Root tests cover resource metadata, generated registry consistency, promotion/linking safety, install behavior, and maintenance scripts. Use `tmp_path` for filesystem isolation and assert safety invariants rather than incidental formatting.

When adding installer behavior, test at least:

- clean install;
- idempotent reinstall;
- differing config refusal;
- forced backup/replacement;
- unmanaged target refusal;
- skill and agent symlink behavior.
