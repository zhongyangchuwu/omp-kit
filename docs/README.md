# Documentation and planning map

This repository separates **accepted current truth**, **design rationale/evidence**, **active work**, **implementation review**, **routine session evidence**, **durable experiment evidence**, and **historical evidence**. Do not use one mutable document as all of them.

## Information model

There is no single linear authority chain because different questions need different sources. When sources conflict, first classify the claim as intent/authorization, current observable state, accepted policy, active work, rationale/evidence, or historical context; then use the authority appropriate to that claim type. See [`design/context-authority.md`](design/context-authority.md) for the accepted conflict/provenance policy.

### Behavior and design truth

```text
actual repository + observed runtime behavior
-> executable policy/resources (agents, skills, rules, extensions)
-> current docs
```

Use this path to answer what omp-kit currently does and which design boundaries are accepted. If docs disagree with repository/runtime evidence, investigate and update the docs. Direct observation establishes current state; it does not by itself define desired policy or user intent.

### Design rationale and evidence

```text
design-foundations.md
-> design/*.md
-> linked Issues / experiments / external evidence
```

`design-foundations.md` is the short current project intuition. `design/*.md` records why an individual mechanism exists: observed problem, evidence and counter-evidence, current design, observed effect, open Issues, and revisit triggers.

Design records explain **why** current mechanisms exist; they do not override actual repository/runtime behavior. Unresolved questions that can change implementation or policy belong in GitHub Issues, not only in a design file or model memory.

### Routine session evidence

```text
normal OMP session
-> OMP session/stats store
-> local omp-kit compact session summaries
-> aggregate report for later #5/#8/#9 analysis
```

Routine dogfood sessions are observations, not experiments by default. OMP remains the raw session/stat authority; omp-kit derives compact local summaries outside Git without copying full transcripts or adding a model-visible logging turn.

See [`session-evidence.md`](session-evidence.md) and completed Issue #21 for the accepted collector/schema contract and runtime evidence.

### Durable experiment evidence

```text
owning Issue / material experiment
-> evidence/experiments/<experiment-id>/
-> VALIDATION.md and/or relevant design record
```

For an accepted experiment or selected session sample that materially supports a project decision, preserve a small repository-tracked evidence bundle under `../evidence/experiments/`. The bundle captures exact revisions, method, normalized observations, result, and evidence limits so the claim remains auditable from an offline checkout.

Issues still own chronological discussion and experiment progress. Evidence bundles are durable snapshots, not project diaries or generic log dumps. Large raw traces/logs stay outside main Git by default; retain them externally with a checksum only when they materially improve later audit or reproducibility.

See `../evidence/README.md`, `experiments.md`, and Issue #12 for the current contract.

### Work coordination

```text
WORKING_STATE.md
-> open GitHub Issues
-> active Pull Requests
```

`WORKING_STATE.md` is only the current entry point: objective, active/inactive work index, important runtime baseline, and next action. Detailed experiments, unresolved design discussion, implementation evidence, and deferred history belong with their owning Issue/PR/current doc.

Open means unfinished. Repositories may distinguish current attention from parked unfinished work with active/inactive labels, but only completed acceptance criteria justify closing an Issue.

### Historical rationale

```text
closed Issues + merged Pull Requests
-> docs/archive/ when local durable history is useful
-> git history
```

Closed discussions remain useful decision records. Archive files preserve phase-specific evidence that is too large or specialized for current docs, but they do not override current repository/runtime behavior.

## GitHub Issues: unresolved work and discussion

Open an Issue when a concrete unresolved problem, experiment, dependency, or future decision may change repository state and has a meaningful closure condition.

Do not open an Issue merely for a vague idea, a settled architectural invariant, or a rejected approach that is already documented as policy.

Lightweight title prefixes describe problem shape rather than authority:

```text
[design]       unresolved design question that may change policy/architecture
[workflow]     workflow/policy work
[experiment]   evidence gathering before a policy/implementation decision
[feedback]     structured feedback capability/product work
[telemetry]    routine evidence collection/summary infrastructure
[coordination] multi-agent coordination/supervision problem
[release]      version/onboarding/release-candidate preparation
```

A useful Issue normally records the problem/goal, evidence, scope and ownership, current decision/hypothesis, acceptance criteria, related upstream work when relevant, and a clear closure/reactivation condition.

For OMP-owned runtime problems, describe the actual omp-kit problem first, explain why the missing contract belongs to OMP, and then record the current released/upstream situation. Do not organize local tracking solely around an upstream ticket number.

When an Issue is resolved, promote only the durable accepted result into the relevant current doc, design record, evidence bundle, agent, skill, rule, extension, or validation summary. Discussion history remains in the closed Issue/PR.

## Pull Requests: implementation and review

PRs own concrete code/document changes, implementation evidence, and review discussion. A design/dogfood Issue may outlive one PR. A merged PR does not automatically complete its Issue; close only when the owning acceptance criteria are satisfied.

## Self-hosting feedback

`omp_kit_feedback` is a bounded qualitative evidence channel, not an Issue creator or self-modification mechanism.

```text
real Main/worker observation
-> omp_kit_feedback when reusable friction exists
-> later human/Main/project triage
-> create/update Issue, update design/policy, or no action
```

Main and task agents may record a finding they directly observed when the tool is available. That ability does not expand task scope and does not authorize repository, Harness, policy, or Issue mutation.

`feedback != authorization`, `feedback != issue`, and `report != self-modify`.

Current released OMP does not expose first-class caller-agent identity in the public extension context. The feedback tool therefore records supported session/file provenance rather than guessing the caller; routine session evidence can later correlate those files with OMP trace tracks.

## Active coordination

- `WORKING_STATE.md` — short mutable navigation index shared by ChatGPT and local OMP agents. Always inspect the actual branch/HEAD before trusting mutable state.
- GitHub Issues — detailed active/inactive unresolved work and experiment state.
- Active PRs — concrete implementation/review state; exact readiness and tested candidate belong here.
- local session-evidence store — routine quantitative dogfood summaries outside Git.
- `../evidence/` — selected material experiment/decision snapshots that should remain auditable independently of live session stores.

## Current documentation

- `WORKING_STATE.md` — current project navigation index and next actions.
- `design-foundations.md` — short project intuition and index of evidence-backed design principles.
- `design/` — one evidence/rationale record per meaningful mechanism; see `design/README.md` for the record contract and coverage backlog.
- `design/context-authority.md` — accepted claim-type-specific authority, provenance, conflict handling, and push-vs-reference context policy.
- `architecture.md` — accepted ownership, runtime, and repository boundaries.
- `workflows.md` — accepted maintenance and runtime workflow conventions.
- `session-evidence.md` — routine OMP-native session evidence collection, summary schema, storage, and reporting.
- `experiments.md` — material experiment/run artifact lifecycle and promotion boundary.
- `VALIDATION.md` — current validation summary and evidence boundaries. Detailed completed phase/runtime validation is archived or linked to durable experiment evidence.
- `../evidence/README.md` — contract for small repository-tracked experiment evidence bundles.
- `omp-configuration.md` — native configuration ownership plus the supported legacy configuration snapshot.
- `omp-installation.md` — legacy/compatibility installer and recovery behavior; native plugin installation is preferred for new development.
- `omp-runtime-notes.md` — long-lived OMP/Pi capability notes. Recheck version-sensitive claims against the installed OMP version.
- `omp-compatibility.md` — changelog triage and version/impact-based OMP compatibility policy.
- `resource-model.md` — repository resource/provenance metadata model.
- `skill-design.md` — reusable skill design conventions.

## Archives

### `archive/harness-v2/`

Completed Harness v2 guide, handoff, runtime experiments, test automation plan, local report, and migration records. Harness v2 was merged to `main`; these files are retained for provenance and historical validation rather than active routing.

### `archive/native-foundation/`

Completed Phase 0/1 ownership audit, roadmap, and detailed version-specific validation evidence. Settled principles are promoted into current docs/policy; unresolved work is tracked in GitHub Issues indexed from `WORKING_STATE.md`.

## Maintenance rules

- Keep the root of `docs/` biased toward current accepted material.
- Keep `design-foundations.md` short; put mechanism-level rationale/evidence in `design/*.md`.
- Every meaningful design record should expose its problem, evidence limits, observed effect, and revisit trigger.
- If a design record has an unresolved question that can change implementation/policy, persist it in an Issue; do not rely on chat/model memory.
- Keep routine session summaries outside Git; promote only selected material evidence through `experiments.md` / `evidence/experiments/`.
- Do not silently rewrite historical experiment bundles. Material reruns get new ids; corrections must be explicit.
- Keep `WORKING_STATE.md` short; replace stale state instead of accumulating a project diary.
- Put unresolved experiments, dependencies, and deferred work in Issues rather than adding roadmap sections to current docs.
- Prefer closed Issues/merged PRs as decision history before inventing a separate ADR system.
- Move phase-specific logs/handoffs into `archive/` only when they stop being current authority and local durable history is actually useful.
- Do not delete historical evidence merely to reduce file count.
