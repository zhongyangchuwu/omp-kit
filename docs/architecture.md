# Repository architecture

OMP Kit owns reusable workflow policy, a personally maintained Skill library, bounded feedback and project-specific derived evidence. OMP owns the runtime. The repository also distributes accepted design decisions and compact supporting experiments so a person can understand it without reconstructing Issue history.

## Resource categories

| Category | Current resources | Boundary |
| --- | --- | --- |
| Core workflow | Four task agents, Main rule, `omp-workflow`, `git-workflow`, `bounded-executor`, `omp-review`, feedback and session evidence | Defines routing, scope, integration, acceptance and observation |
| Maintained experience Skills | `code-taste`, `omp-design`, `omp-debug`, `omp-research`, `omp-test`, `omp-verification`, `program-language`, `skill-authoring`, `omp-planning-artifacts` | The maintainer's reusable judgment, methods and specialized workflows |
| Integrations | `autodl`, `document-parser`; future service/provider/MCP adapters | Separate dependencies, credentials, network, billing or data-disclosure consequences |

These categories describe responsibility, not value, maturity or installation state. They coexist in this repository. All fifteen maintained Skills remain under the existing `skills/` discovery root; this cleanup does not force separate packages, hide resources, change tool permissions or install external services.

A Skill need not depend on omp-kit to be worth maintaining here. `code-taste` and `omp-design`, for example, capture practical user preferences rather than missing OMP runtime features.

## Discovery and maintenance metadata

OMP discovers `skills/*/SKILL.md`, agents, rules and registered extensions through the native plugin. `resource.yaml` and the generated `registry.yaml` remain useful to the Skill-library maintenance workflow for provenance, risk, activation intent and validation. They do not replace OMP's runtime discovery or enforce permissions.

An explicit-only workflow may remain model-visible so an explicit request can select it. Do not equate explicit-only metadata with OMP hiding semantics or claim that the registry is a security boundary.

Metadata generation, promotion, risk inspection and standalone skill linking retain active consumers in `skill-authoring` and maintenance workflows. They are not the retired Harness v2 runtime-config installer.

## Installation and configuration

Use `omp plugin link .` after installing the checkout's Bun dependencies. OMP links native resources; the repository does not replace normal user settings or provider models. `omp plugin uninstall omp-kit` removes the plugin registration.

The legacy Harness v2 configuration snapshot, config-copy installer, its exclusive composition helper and tests are retired. User configuration already installed on a machine is not automatically removed. See [installation](omp-installation.md) for migration precautions.

Python/uv remain the toolchain for maintained library tools and tests, with AutoDL using its own environment. Bun/TypeScript own feedback and session-evidence code. Toolchains follow current consumers, not a goal of using only one language.

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

## Session evidence

OMP owns raw sessions, trace reconstruction, generic stats and usage normalization. The collector derives compact local `omp-kit.session-evidence/v1` summaries and aggregates for #5/#8/#9. It is incremental, not a second raw-journal parser or telemetry database.

Routine summaries stay outside Git. Feedback is linked through supported root/child session-file provenance. Provider identity is sampled per track/model rather than an exact per-request routing ledger. Selected material results may become compact committed experiments under the existing evidence policy.

## Verification and rationale

`just verify` covers the retained native product and library maintenance surfaces. CI runs it on PR merge refs and landed `main`, with lockfile, diff and drift checks. Isolated AutoDL tests mock remote operations; they are not cloud acceptance.

Real OMP/provider/profile behavior needs the relevant target environment. Existing claim-specific evidence and limits live in [VALIDATION](VALIDATION.md). Stable principles and counter-evidence live in [design records](design/README.md), not only in Issues.
