# Verification and acceptance

## Problem

Agent workflows can waste effort in two symmetric ways:

```text
insufficient verification
-> mechanical defects escape

ritual verification
-> the same full suite/review is repeated against equivalent or transient trees
-> extra tool turns, output, waiting and attention without new evidence
```

omp-kit needs evidence-driven acceptance without turning every worker handoff or workflow phase boundary into another identical repository-wide test run.

## Evidence

### Mechanical evidence and model judgment solve different problems

**Type:** engineering argument + project dogfood.

Deterministic checks are good at falsifying mechanical contracts such as tests, types, generated registries and repository consistency. Strong review is more valuable for semantics, lifecycle, product intent, security, ambiguity and cross-slice reasoning that those checks do not encode.

Repeating either layer without changed state or a new question does not automatically add independence.

### Current omp-kit deterministic gate is cheap and provider-free

**Type:** repository/runtime fact.

The latest accepted local gate before this policy edit ran once at commit `8bbd02c3a2350b0198c454d4ec41666c7cca366f` and passed:

```text
98 Python tests
11 Bun tests / 57 assertions
TypeScript typecheck
harness validation
registry check / validation
git diff --check
```

OMP remained 18.1.20 before and after, and real profile/config/plugin fingerprints were unchanged.

The older 126-Python-test count is historical; parser-specific tests were later retired under completed Issue #14.

Reference: `../VALIDATION.md` and Issue #9 verification chronology.

### Issue #6 established integrated acceptance ownership

**Type:** repository verification / accepted workflow policy.

Issue #6 established that a worker's scoped verification is evidence, while the accepted combined tree needs explicit integration ownership and deterministic acceptance. That distinction remains useful.

The current Issue #9 audit narrows one part of the earlier policy: a cheap full gate should not be duplicated mechanically in every worker and then repeated on the integrated tree when the worker run answers no distinct question.

### Current user-directed efficiency constraint

**Type:** project requirement.

Current development deliberately prioritizes real omp-kit work over synthetic capability tests and redundant process. Local Agent time is primarily reserved for deterministic verification that cannot be performed through the web-side repository workflow.

This does **not** lower the final acceptance standard. It changes when identical evidence is collected.

### Runtime capability boundary matters for reviewer trust

**Type:** project runtime audit.

Released OMP 18.1.20 still does not contain the hard child capability boundary required by Issue #4. A prompt-described reviewer role therefore remains distinct from a runtime-enforced security boundary.

## Interpretation

Verification has several layers with different jobs:

```text
worker-local evidence
  -> did this scoped change survive the checks relevant to the change?

integrated deterministic gate
  -> does the accepted final tree mechanically satisfy repository contracts?

strong / independent review
  -> are there semantic, lifecycle, product, security, ambiguity or cross-slice failures not captured by cheap checks?

external read-back / real-state evidence
  -> did an operation against the external world actually happen as intended?
```

The objective is **minimum evidence duplication at the same acceptance strength**, not minimum testing.

## Design principle

> Prefer the cheapest evidence that can falsify the relevant failure mode, and do not collect the same evidence twice unless the state or question changed.

A repository-wide full gate is valuable because it answers a broad mechanical question about one concrete tree. Once that tree changes materially, the answer may be stale. Before it changes, rerunning the same gate solely because work crossed a handoff or phase label usually adds little.

Strong reviewer/model effort should likewise add a different kind of evidence or judgment rather than restating a compile/test-clean result.

## Current mechanism

Default flow:

```text
implementation / debugging
-> focused checks that answer the current change
-> handoff with concrete evidence

related writes settle
-> reconcile actual writes and cross-slice consumers
-> run one full deterministic gate on the accepted integrated tree
-> selective strong review when consequence / ambiguity warrants it
-> fixes, if any
-> rerun affected checks and full gate only when the changed tree makes prior evidence stale
```

### Worker-local full gate

A worker does **not** run the repository-wide full gate merely because it is cheap.

A worker-local full gate is appropriate when it has a distinct purpose, for example:

- one worker owns the exact final tree and its result can be reused as the final mechanical acceptance gate;
- an isolated worktree needs a pre-merge safety check;
- a cross-slice failure cannot be diagnosed with narrower checks;
- Main explicitly asks for that evidence before integration.

On a shared changing tree, a worker-level full pass may describe another workstream's partial state and is especially poor evidence for the eventual accepted tree.

### Integrated full gate

After related writes settle, the integrated tree receives the normal repository-wide deterministic gate when that gate is fast, offline, provider-free and relevant. This is the standard mechanical acceptance point.

If integration or review changes behavior covered by the gate, the prior result is stale and should be rerun. If only workflow bookkeeping changes while the tree relevant to the gate does not, there is no ritual rerun requirement.

### Shared contracts

For shared interfaces/catalogs/types/configuration contracts, integration still considers at least:

- production call sites;
- tests and fixtures;
- mocks and fakes;
- contract-facing docs/examples;
- explicit integration ownership.

Workers report out-of-scope consumers instead of silently widening their write scope.

### Strong review

Independent review remains selective by failure cost, ambiguity and the value of a second judgment. When practical, give the reviewer a mechanically clean integrated diff so model effort is spent on failure classes automation did not already decide.

### Expensive or external verification

If full verification is slow, externally metered, destructive or otherwise expensive, use focused checks plus one proportionate integrated acceptance strategy. External writes still require suitable read-back/idempotency/state evidence; a local test pass cannot substitute for external state observation.

## Evaluation / observed effect

Issue #6 supplied the accepted distinction between worker evidence and integrated acceptance. Issue #9 now removes two recurring process costs from the current default workflow:

1. mandatory generic end-of-task self-reflection;
2. mechanical duplication of the same full deterministic gate across worker handoff and integrated acceptance.

The first ablation is locally verified. The verification-dedup change is web-authored and remains pending the next normal local deterministic gate; do not describe it as verified until that gate passes.

Future real omp-kit dogfood should show whether focused worker checks plus one integrated full gate preserve defect detection while reducing repeated tool output and workflow turns. No bespoke A/B is required unless real failures create a decision-critical ambiguity.

## Counter-evidence and limits

- A worker-local full run can be high-value before an isolated/risky merge or when it is the only practical way to diagnose cross-slice breakage.
- Passing tests/typecheck does not establish UI usability, external-service state, security properties or product semantics unless directly covered.
- High-consequence changes may require expensive E2E/manual/external verification even after the normal deterministic gate passes.
- If a review or integration fix changes code covered by the full suite, rerunning it is new evidence about a new tree, not duplication.
- Reducing duplicate runs must not become an excuse to skip the final integrated gate merely to save tokens or time.

## Current status

**Accepted verification architecture; current-generation duplication policy is being simplified under recurring Issue #9.**

Issue #6 remains the historical source for integrated acceptance ownership. Issue #9 owns recurring removal of redundant process as models/workflows evolve.

## Related implementation / Issues

- `../workflows.md`
- `../VALIDATION.md`
- `../../skills/omp-workflow/SKILL.md`
- `../../skills/omp-workflow/references/execution.md`
- `../../skills/omp-workflow/references/delegation.md`
- `../../agents/sol-review.md`
- Issue #4 — reviewer capability boundary
- Issue #6 — completed integration/verification ownership policy
- Issue #8 — delegation economics / accepted useful work
- Issue #9 — recurring model-compensation/process ablation

## Revisit triggers

Re-audit when:

- focused worker checks repeatedly miss failures that an early worker full gate would have caught materially sooner;
- repository verification becomes materially slower or gains external/provider dependencies;
- strong review repeatedly duplicates deterministic evidence without distinct findings;
- a new failure class repeatedly escapes current tests/review;
- shared-interface integration checks add ceremony without preventing real omissions;
- OMP gains stronger runtime-enforced reviewer/read-only semantics;
- external systems make read-back/idempotency evidence central to normal work.
