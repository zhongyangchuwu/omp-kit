# Repository architecture

OMP Kit owns reusable workflow policy, a personally maintained Skill library, bounded feedback and project-specific derived evidence. OMP owns the runtime. The repository also distributes accepted design decisions and compact supporting experiments so a person can understand it without reconstructing Issue history.

## Resource categories

| Category | Current resources | Boundary |
| --- | --- | --- |
| Core Harness | Four task agents, Main rule, `omp-workflow`, `git-workflow`, `bounded-executor`, `omp-review`, feedback, session evidence and assurance | Defines routing, scope, integration, acceptance, observation and human-facing review |
| Experience Skills | `code-taste`, `omp-design`, `omp-debug`, `omp-research`, `omp-test`, `omp-verification`, `program-language`, `skill-authoring`, `omp-planning-artifacts` | The maintainer's reusable judgment, methods and specialized workflows |
| Integrations | `autodl`, `document-parser`; future service/provider/MCP adapters | Separate dependencies, credentials, network, billing or data-disclosure consequences |

These categories describe responsibility, not value, maturity, installation state or permission. All fifteen maintained Skills currently coexist under the same `skills/` discovery root. A category does not hide a Skill or change runtime behavior; any future behavior difference must be implemented by a real OMP/package/feature boundary rather than descriptive metadata.

A Skill need not depend on omp-kit to be worth maintaining here. `code-taste` and `omp-design`, for example, capture practical user preferences rather than missing OMP runtime features.

## Discovery and source of truth

OMP discovers `skills/*/SKILL.md`, agents, rules and registered extensions through the native plugin. The filesystem plus each resource's native definition is the source of truth: `SKILL.md` owns Skill identity/description and package/extension manifests own their respective runtime wiring.

There is no parallel resource registry or activation database. Git and PR history retain retired implementations and chronology; current behavior stays in current files. If the repository later grows enough to need a machine-readable catalog, add one only for a concrete consumer rather than as a second description of the same tree.

## Installation and configuration

Use `just install` for the checkout's native OMP install/link flow. OMP links native resources; the repository does not replace normal user settings or provider models. `omp plugin uninstall omp-kit` removes the plugin registration.

The legacy Harness v2 configuration snapshot, config-copy installer, its exclusive composition helper and tests are retired. User configuration already installed on a machine is not automatically removed. See [installation](omp-installation.md) for migration precautions.

The root repository uses Bun/TypeScript for runtime code and deterministic contracts. AutoDL remains an isolated Python/uv integration with its own `pyproject.toml`, lockfile and tests. Toolchains follow concrete consumers; there is no root Python environment solely for maintenance helpers.

## Agent and workflow boundary

Main owns user intent, routing, material judgment, integration, verification judgment, external repository mutation and final reporting. It can execute directly, delegate one bounded task, or use independent parallel workstreams. Delegation is a route, not a mandatory stage.

Workers execute scoped work without recursive orchestration. Their tools narrow the action surface but are not a filesystem/network sandbox. `sol-review` retains its conservative review surface; findings return to Main for routing.

The shared `omp_kit_feedback` sink permits Main/worker observations without granting repository, policy, configuration or Issue authority. Reporting does not trigger self-modification. Later triage owns promotion decisions.

## Project knowledge

```text
current behavior and policy -> executable resources + current docs
durable accepted rationale  -> docs/design/
compact decision evidence   -> evidence/experiments/
short navigation            -> WORKING_STATE.md
unfinished work             -> Issues
implementation/review       -> PRs
chronology                  -> Git + Issue/PR history
```

Issue-centered state is the normal multi-session workflow. The maintained `.planning/` Skill remains an explicit specialized option for projects that need a richer local/offline phase dossier. Neither mode justifies duplicate sources of current truth.

## Session evidence and assurance

OMP owns raw sessions, trace reconstruction, generic stats and usage normalization. omp-kit derives bounded quantitative evidence and human-facing assurance facts/findings from supported OMP evidence without becoming a second raw-journal parser or telemetry database.

Routine summaries stay outside Git. Selected material results may become compact committed experiments under the existing evidence policy. Assurance is a review snapshot with explicit coverage limits, not a proof of task quality or safety.

## Verification and rationale

`just verify` covers the retained native product and library maintenance surfaces. CI runs it on PR merge refs and landed `main`, with dependency-lock, diff and drift checks. Isolated AutoDL tests mock remote operations; they are not cloud acceptance.

Real OMP/provider/profile behavior needs the relevant target environment. Existing claim-specific evidence and limits live in [VALIDATION](VALIDATION.md). Stable principles and counter-evidence live in [design records](design/README.md), not only in Issues.
