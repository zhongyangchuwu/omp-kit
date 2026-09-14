# Documentation and planning map

This repository separates **accepted current truth**, **design rationale/evidence**, **active work**, **implementation review**, **durable experiment evidence**, and **historical evidence**. Do not use one mutable document as all six.

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

### Durable experiment evidence

```text
owning Issue / experiment
-> evidence/experiments/<experiment-id>/
-> VALIDATION.md and/or relevant design record
```

For an accepted experiment that materially supports a project decision, preserve a small repository-tracked evidence bundle under `../evidence/experiments/`. The bundle captures exact revisions, method, normalized observations, result, and evidence limits so the claim remains auditable from an offline checkout.

Issues still own chronological discussion and experiment progress. Evidence bundles are durable snapshots, not project diaries or generic log dumps. Large raw traces/logs stay outside main git by default; retain them externally with a checksum only when they materially improve later audit or reproducibility.

See `../evidence/README.md` and Issue #12 for the current contract and its dogfood status.

### Work coordination

```text
WORKING_STATE.md
-> open GitHub Issues
-> active Pull Requests
```

`WORKING_STATE.md` is only the current entry point: active objective, blockers, issue/PR index, runtime baseline, and next action. Detailed experiments, unresolved design discussion, upstream tracking, and deferred work belong in Issues.

### Historical rationale

```text
closed Issues + merged Pull Requests
-> docs/archive/
-> git history
```

Closed discussions remain useful decision records. Archive files preserve phase-specific evidence that is too large or specialized for current docs, but they do not override current repository/runtime behavior.

## GitHub Issues: unresolved work and discussion

Open an Issue when a concrete unresolved problem, experiment, upstream dependency, or future decision may change repository state and has a meaningful closure condition.

Do not open an Issue merely for a vague idea, a settled architectural invariant, or a rejected approach that is already documented as policy.

Until a richer label taxonomy is useful, title prefixes provide lightweight classification:

```text
[design]     unresolved design question that may change policy/architecture
[workflow]   omp-kit-owned workflow/policy work
[experiment] evidence gathering before a policy/implementation decision
[upstream]   an OMP-owned dependency or capability gap
```

A useful Issue normally records:

```text
Problem / goal
Evidence
Scope and ownership
Current decision / hypothesis
Acceptance criteria
Upstream/related references
Rejected approaches when material
Promotion target
Revisit trigger when relevant
```

Use Issue comments for chronological experiment results and status updates instead of appending logs to `WORKING_STATE.md`.

For OMP-owned problems, keep a local tracking Issue when the upstream state materially blocks or shapes omp-kit. The local Issue records **omp-kit impact and closure criteria**; the upstream issue/PR owns the runtime implementation discussion.

When an Issue is resolved, promote only the durable accepted result into the relevant current doc, design record, evidence bundle, agent, skill, rule, extension, or validation summary. The discussion history can remain in the closed Issue/PR.

## Pull Requests: implementation and review

PRs own concrete code/document changes, implementation evidence, and review discussion. A design or tracking Issue may outlive one PR; a PR should not become the long-term backlog for unrelated follow-up work.

## Self-hosting feedback

`omp_kit_feedback` is a raw durable finding channel, not an Issue creator.

```text
real work / runtime evidence
-> Main judgment
-> omp_kit_feedback when reusable friction exists
-> later triage
-> create/update Issue, update a design record, or no action
```

`feedback != issue` and `report != self-modify`. Do not automatically create GitHub Issues, change policy, or edit the repository merely because feedback was recorded.

## Active coordination

- `WORKING_STATE.md` — short mutable index shared by ChatGPT and local OMP agents. Pull the branch that owns the current task first: `omp-native-foundation-core` for independent core work / PR #17, or `omp-native-foundation` only for feedback-specific PR #3 work.
- GitHub Issues — detailed active/deferred discussion and experiment state.
- Active PRs — concrete implementation/review state; exact current readiness and tested HEAD belong here rather than in a self-invalidating git-tracked marker.
- `../evidence/` — selected accepted experiment snapshots that should remain auditable independently of Issue availability.

## Current documentation

- `design-foundations.md` — short project intuition and index of evidence-backed design principles.
- `design/` — one evidence/rationale record per meaningful mechanism; see `design/README.md` for the record contract and coverage backlog.
- `design/context-authority.md` — accepted claim-type-specific authority, provenance, conflict handling, and push-vs-reference context policy.
- `architecture.md` — accepted ownership, runtime, and repository boundaries.
- `workflows.md` — accepted maintenance and runtime workflow conventions.
- `VALIDATION.md` — current validation summary and evidence boundaries. Detailed completed phase/runtime validation is archived or linked to durable experiment evidence.
- `../evidence/README.md` — contract for small repository-tracked experiment evidence bundles.
- `omp-configuration.md` — native configuration ownership plus the supported legacy configuration snapshot.
- `omp-installation.md` — legacy/compatibility installer and recovery behavior; native plugin installation is preferred for new development.
- `omp-runtime-notes.md` — long-lived OMP/Pi capability notes. Recheck version-sensitive claims against the installed OMP version.
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
- Preserve accepted experiments that materially support a decision as small `evidence/experiments/<id>/` bundles; do not turn the directory into a generic run log.
- Do not silently rewrite historical experiment bundles. Material reruns get new ids; corrections must be explicit.
- Keep `WORKING_STATE.md` short; replace stale state instead of accumulating a project diary.
- Put unresolved experiments, upstream dependencies, and deferred work in Issues rather than adding new roadmap sections to current docs.
- Prefer closed Issues/merged PRs as decision history before inventing a separate ADR system.
- Move phase-specific logs/handoffs into `archive/` when they stop being current authority.
- Do not delete historical evidence merely to reduce file count.
