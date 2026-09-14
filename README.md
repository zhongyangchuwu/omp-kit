# OMP Kit

OMP Kit is a small, model-neutral workflow layer for Oh My Pi (OMP). The v0.1.0 baseline keeps only the capabilities that define the current product and delegates runtime/session/model behavior to OMP.

## Core surface

```text
OMP runtime
  -> model-neutral task agents
  -> core workflow skills
  -> Main-session workflow rule
  -> bounded structured feedback
  -> compact local session evidence
```

The native plugin exposes four task agents:

- `luna-code`
- `luna-deep`
- `luna-doc`
- `sol-review`

and four core Skills:

- `omp-workflow` — Main routing, integration, verification and project-state policy;
- `git-workflow` — Git/GitHub branch, PR, CI and Issue lifecycle policy;
- `bounded-executor` — worker scope, repair and stop conditions;
- `omp-review` — structured semantic review used by `sol-review`.

Generic development knowledge, cloud/service adapters, document parsing, specialized planning artifacts, Skill-authoring helpers, and provider/MCP integrations are not part of the core package. If one later proves useful enough to maintain, it should be an explicitly installed companion/integration package rather than another default-discovered core Skill.

## Install

From a clone of this repository:

```sh
omp plugin link .
omp plugin list
```

To remove the linked checkout:

```sh
omp plugin uninstall omp-kit
```

OMP owns model selection, normal settings, profiles, session persistence and task/subagent runtime behavior. OMP Kit does not install or replace `config.yml` / `models.yml`.

## Project workflow

For repository work, recover state from durable current sources rather than hidden conversation memory:

```text
actual branch / HEAD / worktree
-> docs/WORKING_STATE.md
-> owning open Issue / active PR
-> only the current references needed for the task
```

Open Issues mean unfinished work. `status:active` and `status:inactive` describe attention, not completion. A merged PR does not close its Issue unless the acceptance criteria are actually complete.

## Structured feedback

`omp_kit_feedback` is a bounded qualitative evidence sink available to Main and task agents when the extension is loaded.

```text
feedback != authorization
feedback != Issue mutation
feedback != repository/policy mutation
feedback != self-modification
```

OMP 18.1.21 runtime acceptance verified Main and normal-worker recording with supported session/file provenance. OMP does not currently expose first-class caller-agent identity through this extension context, so OMP Kit does not fabricate it.

## Session evidence

OMP remains the raw recorder. OMP Kit derives compact local summaries after normal work:

```sh
bun run evidence:collect
bun run evidence:report
```

Useful filters include `--folder`, `--since` and `--json`. The derived store stays outside Git and contains summaries rather than copied conversations. See [`docs/session-evidence.md`](docs/session-evidence.md) for the schema, storage and limitations.

Released OMP 18.1.21 exposes a stats folder/cwd representation mismatch tracked upstream as `can1357/oh-my-pi#12060`; the collector uses public trace `cwd` for normal filesystem-path filtering rather than reproducing OMP's storage-key encoding.

## Capability layers

OMP Kit uses package boundaries rather than an in-repository pseudo-registry:

```text
Core
  default-discovered resources required by the product

Companion
  optional first-party workflow capability, separately installed

Integration
  service/provider/MCP-specific capability with its own dependencies, credentials or risk
```

Core never depends on a companion or integration. An optional capability does not belong under this package's OMP-discovered roots merely because it might be useful someday.

## Development

The repository is Bun-only:

```sh
bun install --frozen-lockfile
bun run verify
```

GitHub Actions runs the same deterministic typecheck/tests on each PR merge-ref and again after an authorized landing on `main`. Passing CI does not establish machine-specific OMP behavior; runtime claims still need the relevant released-runtime smoke.

Current project state: [`docs/WORKING_STATE.md`](docs/WORKING_STATE.md)  
Architecture and layer boundaries: [`docs/architecture.md`](docs/architecture.md)  
Current validation evidence: [`docs/VALIDATION.md`](docs/VALIDATION.md)  
OMP compatibility policy: [`docs/omp-compatibility.md`](docs/omp-compatibility.md)
