# Repository Architecture

## Goal

OMP Kit is a personal Oh My Pi harness: a versioned, auditable, testable source of truth for runtime configuration, model routing, custom agents, reusable skills, and the automation that installs them.

The repository previously centered on a maintained skill library. Harness v2 keeps that skill lifecycle but places it inside a broader runtime architecture.

## Operating principles

- Repository state is canonical; `~/.omp/agent/` is deployed runtime state.
- Secrets never belong in Git. Provider credentials come from environment variables, OMP auth storage, or command-resolved secret references.
- Detailed constraints live with the resource they govern.
- Runtime policy, model routing, agent behavior, skills, and project facts are separate concerns.
- Use the smallest capability surface that solves a task reliably.
- Strong models should spend tokens on high-leverage decisions, not context搬运, repetitive repository exploration, or mechanical edits.
- Durable artifacts exist to preserve state across sessions/people, not merely because a task is large.
- Tests validate installation safety, metadata consistency, and maintained resource invariants.

## Directory layout

```text
config/          Canonical portable OMP runtime/model configuration.
agents/          Custom task-agent definitions with role and tool restrictions.
skills/          Active reusable workflow/reference packs.
drafts/          In-progress skills before promotion.
references/      Gitignored upstream source/reference material.
docs/            Durable harness/project design documentation.
scripts/         Install, registry, validation, promotion, and maintenance automation.
tests/           Repository-level tests.
schemas/         Skill resource metadata schema.
registry.yaml    Generated index for maintained skills/drafts.
justfile         Common maintenance entry points.
```

## Harness layers

### Runtime policy

Universal runtime behavior should stay small. `APPEND_SYSTEM.md` is a last-mile patch surface, not the primary architecture store.

Workflow-level orchestration belongs in `omp-workflow` and its references. Task-specific execution discipline belongs in dedicated skills such as `bounded-executor`.

### Model routing

`config/config.yml` maps semantic roles to concrete provider/model selectors.

Current architecture favors:

```text
Sol = control plane
Luna = workforce
```

Terra remains available as a fallback/experimental niche rather than requiring a permanent default role.

### Custom agents

`agents/` defines task shapes with intentionally narrow tool surfaces. Model identity should normally be indirect through role aliases such as `@fast_worker`, `@good_worker`, or `@review`.

The initial workers are:

```text
luna-code   routine scoped implementation
luna-deep   difficult bounded implementation/debugging
luna-doc    documentation/config synthesis from accepted context
sol-review  selective high-risk review
```

### Skills

Skills remain model-readable procedures and reference packs. Each skill owns one stable concern and uses progressive disclosure rather than becoming a catch-all system prompt.

`resource.yaml` remains the source of truth for maintained skill metadata; `registry.yaml` remains generated.

### Context

The director should communicate immediate intent and boundaries. Workers should retrieve repository facts and, when needed, parent discussion themselves.

Parent transcript retrieval is pull-based rather than automatically inherited. `omp-workflow/references/subagent-context.md` defines Direct, Referenced, and Explicit-contract context transfer.

Main sessions may use OMP's notes-backed context windows; restricted workers can retain simpler context maintenance.

### Observability

Harness decisions should be evaluated from real workloads: completed tasks, retries, escalations, wall time, human interventions, token/cache use, duplicate exploration, and review findings. Model benchmarks inform routing but do not replace measured harness behavior.

## Installation model

`scripts/install_harness.py` deploys the canonical repository state into an OMP agent root.

- skills are linked individually;
- agents are linked individually;
- `config.yml` and `models.yml` are copied rather than symlinked because OMP may write runtime configuration;
- differing runtime config is treated as drift and is not overwritten without `--force`;
- forced replacement creates a timestamped backup first;
- unmanaged real skill/agent files are never replaced by force.

This makes the repository the source of truth while preserving a recoverable runtime boundary.

## Configuration boundary

`config/config.yml` contains portable OMP settings and model-role routing.

`config/models.yml` contains portable provider/model metadata. It may reference secret environment variables through OMP's command-resolved secret syntax, but must never contain the secret value itself.

Machine-specific or sensitive state should remain outside the repository unless a real multi-machine requirement justifies a separate explicit override mechanism.

## Skill resource model

Resource-local `resource.yaml` files answer detailed provenance/risk/activation/verification questions. Top-level `registry.yaml` answers only fast index questions.

Active skills live under `skills/<name>/`; drafts live under `drafts/<name>/`; external source material remains under gitignored `references/` until reviewed and extracted.

## Workflow boundary

`omp-workflow` coordinates who works, how workstreams persist, when to escalate, and how context is transferred.

`bounded-executor` governs how an implementation worker executes, repairs, verifies, and stops.

`omp-review` and specialized review agents govern review behavior.

Project-specific facts remain in project docs/rules rather than reusable global skills.

## Future upgrade path

Potential future additions include stronger context-curator agents, more role-specific workers, observability tooling, MCP/tool packages, and minimal-harness support upstream in OMP. Add these only when a real maintained artifact and measurable use case exist.

The target is not maximum framework complexity. It is a small, inspectable harness that completes more reliable work with less human attention and less expensive-model usage.
