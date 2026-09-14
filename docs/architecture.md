# Repository architecture

OMP Kit owns reusable policy and resources, not machine credentials or the OMP runtime itself. `package.json` exposes model-neutral task agents, active skills, the Main-only workflow rule, the bounded feedback extension, and the session-evidence CLI through the native plugin/package surface. `config/` retains the legacy Harness v2 settings/provider snapshot and migration inputs. `docs/` records current repository facts plus design rationale/evidence; mechanism-level rationale under `docs/design/` does not override actual repository/runtime behavior.

Skill `resource.yaml` files remain the provenance/risk/activation source for repository maintenance, while OMP discovers plugin skills from `skills/*/SKILL.md`. The native contract exposes exactly the active registry set. Repository activation modes are policy semantics, not a mechanical one-to-one mapping to OMP `hide` frontmatter: an `explicit-only` skill may need to stay model-visible so an explicit user workflow request can select it, while OMP hidden/`disable-model-invocation` skills are appropriate only when a separate explicit/manual invocation path exists. `registry.yaml` remains generated and continues to index skills and drafts.

## Installation boundary

The preferred native development path is `omp plugin link .`. OMP links the package and discovers `agents/`, `skills/`, `rules/`, and registered extensions without copying ordinary resources into the agent root or changing `config.yml`/`models.yml`.

The Python installer remains the legacy/compatibility path. It renders YAML with explicit profiles/local overlays, validates agent and skill references, stages desired resources, checks every target before writes, and copies managed units without requiring symlink privileges. Its manifest, backup, drift and rollback guarantees remain unchanged. The legacy skill-only symlink helper is still explicit opt-in tooling and must not be mixed casually with a managed copy installation.

Runtime config edits are local drift until deliberately captured in a private overlay or canonical source. The installer preserves an existing machine's setup/consent but never promotes that state to portable defaults. Auth databases, `.env`, sessions, ordinary feedback/session-evidence data, MCP settings and project configuration are outside its Git ownership.

## Agent/workflow boundary

Main owns user intent, routing, material judgment, integration, verification judgment, remote repository mutation, final reporting, and promotion decisions about self-hosting evidence. `omp-workflow` is the default Main operating workflow for repository work; it may choose direct Main execution, one bounded delegate, or parallel independent delegates. Delegation is an execution route, not the condition for entering the workflow.

Workers do bounded scoped work and do not start another orchestration layer. Workflow references own delegation and context authority; bounded-executor owns repair/stop behavior; omp-review owns review procedure. Independent review is selected by risk, not an unconditional stage for every edit.

`omp_kit_feedback` is deliberately different from authority-bearing mutation: Main and task agents may append bounded structured observations they directly encounter. That write does not grant repository/configuration/Issue/policy authority and does not trigger self-modification. Later Main/human/project triage owns promotion.

Native OMP task/hub infrastructure is reused. No new Vibe runtime is implemented. Custom tools narrow the worker action space but retain OMP's base child prompt and host behavior. Notes-backed context remains an experimental runtime feature, not an implementation of shared cross-agent memory in this repository.

## Project-state boundary

The default durable project-state model is issue-centered rather than a bespoke state database:

```text
actual repository/runtime state
-> current docs/executable policy
-> docs/WORKING_STATE.md as short navigation index
-> open Issues for unfinished independently closable work
-> Pull Requests for implementation/review/CI
-> design records for durable accepted rationale
-> Issue/PR history for chronology
```

`.planning/` remains an explicit specialized/offline phase-dossier mode. It is not initialized merely because work spans multiple sessions.

## Session evidence boundary

OMP owns raw session persistence, trace reconstruction, generic stats and usage normalization. omp-kit does not parse raw journals or own a second telemetry database.

The v0 session-evidence layer adds only project-specific derived semantics:

```text
OMP public session/stats surfaces
-> compact local omp-kit.session-evidence/v1 summaries
-> aggregate report for #5/#8/#9 analysis
-> optional material promotion through #12
```

Routine summaries stay outside Git and do not copy full transcripts. Structured feedback is linked by supported session-file provenance across root/child tracks. Provider identity is sampled, not claimed as an exact per-request routing ledger.

## Validation boundary

Kit consistency checks are not a reimplementation of OMP's settings schema. The routine CI gate validates repository contracts offline on PR merge-ref and landed `main`. Isolated installer tests exercise safe file operations/composition without credentials.

Full OMP/provider/browser/LSP behavior needs the actual target environment when that behavior is the claim. Runtime-specific evidence and limits are recorded in `docs/VALIDATION.md` and owning Issues/PRs.

Design records preserve problem/evidence/mechanism/revisit rationale for meaningful features. Unresolved questions that can change policy or implementation must be tracked in GitHub Issues rather than remaining only in design prose or model memory. Historical phase handoffs, roadmaps, migration records and retained experiments preserve evidence but do not override current repository/runtime behavior.
