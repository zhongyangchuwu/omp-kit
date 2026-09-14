# Repository architecture

OMP Kit owns reusable policy and resources, not machine credentials or the OMP runtime
itself. `package.json` exposes model-neutral task agents, active skills, and the
Main-only workflow rule through OMP's native plugin manager. `config/` retains the
legacy Harness v2 settings/provider snapshot and migration inputs. `docs/` records
current repository facts plus design rationale/evidence; mechanism-level rationale lives
under `docs/design/` and does not override actual repository/runtime behavior.

Skill `resource.yaml` files remain the provenance/risk/activation source for repository
maintenance, while OMP discovers plugin skills from `skills/*/SKILL.md`. The native
contract exposes exactly the active registry set and mirrors explicit-only activation
with OMP skill frontmatter. `registry.yaml` remains generated and continues to index
skills and drafts.

## Installation boundary

The preferred native development path is `omp plugin link .`. OMP links the package and
discovers `agents/`, `skills/`, `rules/`, and registered extensions without copying
ordinary resources into the agent root or changing `config.yml`/`models.yml`.

The Python installer remains the legacy/compatibility path. It renders YAML with
explicit profiles/local overlays, validates agent and skill references, stages desired
resources, checks every target before writes, and copies managed units without requiring
symlink privileges. Its manifest, backup, drift and rollback guarantees remain unchanged.
The legacy skill-only symlink helper is still explicit opt-in tooling and must not be
mixed casually with a managed copy installation.

Runtime config edits are local drift until deliberately captured in a private overlay
or in canonical source. The installer preserves an existing machine's setup/consent,
but never promotes that state to portable defaults. Auth databases, `.env`, sessions,
MCP/extension settings and project configuration are outside its ownership.

## Agent/workflow boundary

Main owns user intent, routing, material judgment, integration, verification judgment,
final reporting, and omp-kit self-hosting feedback judgment. `omp-workflow` is the
default Main operating workflow for repository work; it may choose direct Main
execution, one bounded delegate, or parallel independent delegates. Delegation is an
execution route, not the condition for entering the workflow.

Workers do bounded scoped work and do not start another orchestration layer. Workflow
references own delegation and context authority; bounded-executor owns repair/stop
behavior; omp-review owns review procedure. Independent review is selected by risk, not
an unconditional stage for every edit.

Native OMP task/hub infrastructure is reused. No new Vibe runtime is implemented.
Custom tools narrow the worker action space but retain OMP's base child prompt and
host behavior. Notes-backed context remains an experimental runtime feature, not
an implementation of shared cross-agent memory in this repository.

## Validation boundary

Kit consistency checks are not a reimplementation of OMP's settings schema. Isolated
installer tests exercise safe file operations and composition without credentials.
Full OMP/provider/browser/LSP behavior needs the actual target environment. Record
what was executed and what remains untested in `docs/VALIDATION.md`.

Design records under `docs/design/` preserve problem/evidence/mechanism/revisit rationale
for meaningful features. Unresolved questions that can change policy or implementation
must be tracked in GitHub Issues rather than remaining only in design prose or model
memory. Historical phase handoffs, roadmaps, migration records, and experiment logs live
under `docs/archive/`; they preserve evidence but do not override current repository/runtime
behavior.
