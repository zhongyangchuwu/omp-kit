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

### Current deterministic gate is cheap, provider-free and CI-executable

**Type:** repository/runtime fact.

The independent core `just verify` contract currently covers:

```text
98 Python repository tests
harness/static validation
registry freshness / validation
git diff --check
```

The stacked feedback tree adds its checked-in Bun/TypeScript contract:

```text
TypeScript typecheck
11 Bun tests / 57 assertions
```

Issue #18 moved routine execution of the settled-tree gate to `.github/workflows/verify.yml`. The workflow uses read-only repository permission, checks `uv.lock` freshness, runs the repository-owned `just verify`, and rejects tracked-file drift. It needs no project secrets, provider/model calls, OMP runtime, subagents, capability experiments or telemetry work.

When `bun.lock` is present, the workflow installs Bun and frozen dependencies before running the same repository gate. Bun version selection follows the repository's `packageManager` declaration rather than an independent CI-only version pin.

Exact current commit results belong in GitHub Actions / the owning PR rather than in this design record.

### Issue #6 established integrated acceptance ownership

**Type:** repository verification / accepted workflow policy.

Issue #6 established that a worker's scoped verification is evidence, while the accepted combined tree needs explicit integration ownership and deterministic acceptance. That distinction remains useful.

Issue #9 narrows one part of the earlier policy: a cheap full gate should not be duplicated mechanically in every worker and then repeated on the integrated tree when the worker run answers no distinct question.

### Current user-directed efficiency constraint

**Type:** project requirement.

Current development deliberately prioritizes real omp-kit work over synthetic capability tests and redundant process. GitHub Actions is the normal execution location for repository-wide deterministic acceptance when the claim is CI-supported.

Local agent/runtime effort is reserved for focused implementation checks, CI diagnosis, and claims that genuinely depend on local OMP/runtime/profile state. This does **not** lower the final acceptance standard; it removes duplicate execution of equivalent evidence.

### Runtime capability boundary matters for reviewer trust

**Type:** project runtime audit.

Released OMP 18.1.20 still does not contain the hard child capability boundary required by Issue #4. A prompt-described reviewer role therefore remains distinct from a runtime-enforced security boundary.

## Interpretation

Verification has several layers with different jobs:

```text
worker-local / focused evidence
  -> did this scoped change survive the checks relevant to the change?

integrated deterministic CI gate
  -> does the accepted final tree mechanically satisfy repository contracts?

strong / independent review
  -> are there semantic, lifecycle, product, security, ambiguity or cross-slice failures not captured by cheap checks?

external read-back / real-state evidence
  -> did an operation against the external world actually happen as intended?

local/runtime-specific evidence
  -> did behavior that depends on the installed OMP/profile/machine actually hold?
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
-> handoff with concrete evidence when delegation was used

related writes settle
-> reconcile actual writes and cross-slice consumers
-> push / update the accepted integrated tree
-> one GitHub Actions deterministic gate on that tree
-> selective strong review when consequence / ambiguity warrants it
-> fixes, if any
-> new CI gate only because the accepted tree changed
```

### Worker-local full gate

A worker does **not** run the repository-wide full gate merely because it is cheap.

A worker-local full gate is appropriate when it has a distinct purpose, for example:

- one worker owns an isolated exact final tree and CI is unavailable or the result is needed before push;
- an isolated worktree needs a pre-merge safety check;
- a cross-slice failure cannot be diagnosed with narrower checks;
- Main explicitly asks for that evidence for a distinct reason;
- CI itself is being debugged.

On a shared changing tree, a worker-level full pass may describe another workstream's partial state and is especially poor evidence for the eventual accepted tree.

### Integrated full gate

After related writes settle, GitHub Actions is the normal repository-wide deterministic acceptance point for CI-supported work. It executes the repository-owned gate rather than maintaining a second YAML implementation of the test contract.

If integration or review changes behavior covered by the gate, the prior result is stale and the new commit receives a new CI run. If only workflow bookkeeping changes while the covered tree does not, there is no ritual local rerun requirement.

Local `just verify` remains a useful pre-push/debugging command, not a mandatory duplicate of a passing exact-tree CI result.

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

### Expensive, external or machine-specific verification

If full verification is slow, externally metered, destructive or otherwise expensive, use focused checks plus one proportionate integrated acceptance strategy. External writes still require suitable read-back/idempotency/state evidence; a CI test pass cannot substitute for external state observation.

Likewise, CI does not establish installed OMP/profile/plugin behavior that depends on the user's actual machine. Released-runtime capability smokes remain local/runtime evidence and are run only when the claim requires them.

## Evaluation / observed effect

Issue #6 supplied the accepted distinction between worker evidence and integrated acceptance. Issue #9 has now removed two recurring process costs from the current default workflow:

1. mandatory generic end-of-task self-reflection;
2. mechanical duplication of the same full deterministic gate across worker handoff and integrated acceptance.

Real split/review work validated the second rule: an unchanged settled tree did not justify another local full pass, while later tree changes correctly required new acceptance evidence. Issue #18 then moved that routine integrated evidence to GitHub Actions without changing the acceptance policy itself.

The core and stacked feedback paths have both exercised the Actions design: core skips Bun when no `bun.lock` exists; feedback enables its Bun/TypeScript checks when the lockfile is present. Future dogfood should continue to reveal whether focused local checks plus one automated integrated gate preserve useful defect detection. No bespoke A/B is required unless real failures create a decision-critical ambiguity.

## Counter-evidence and limits

- A worker-local full run can be high-value before an isolated/risky merge or when it is the only practical way to diagnose cross-slice breakage.
- Passing CI tests/typecheck does not establish UI usability, external-service state, runtime security properties or product semantics unless directly covered.
- High-consequence changes may require expensive E2E/manual/external verification even after the normal deterministic gate passes.
- If a review or integration fix changes code covered by the full suite, the resulting CI run is new evidence about a new tree, not duplication.
- Reducing duplicate runs must not become an excuse to ignore a failed/missing final integrated gate merely to save tokens or time.
- GitHub-hosted Linux does not replace platform-specific Windows/macOS checks when platform behavior is the actual claim.

## Current status

**Accepted verification architecture.** Issue #18 completed CI execution of the routine deterministic gate; Issue #9 remains the recurring owner for future removal of redundant model/process scaffolding.

Issue #6 remains the historical source for integrated acceptance ownership. CI changes where the mechanical gate executes, not who owns acceptance judgment or which non-mechanical evidence is required.

## Related implementation / Issues

- `../workflows.md`
- `../VALIDATION.md`
- `../../.github/workflows/verify.yml`
- `../../skills/omp-workflow/SKILL.md`
- `../../skills/omp-workflow/references/execution.md`
- `../../skills/omp-workflow/references/delegation.md`
- `../../agents/sol-review.md`
- Issue #4 — reviewer capability boundary
- Issue #6 — completed integration/verification ownership policy
- Issue #8 — delegation economics / accepted useful work
- Issue #9 — recurring model-compensation/process ablation
- Issue #18 — completed GitHub Actions deterministic gate

## Revisit triggers

Re-audit when:

- focused worker checks repeatedly miss failures that an early worker full gate would have caught materially sooner;
- repository verification becomes materially slower or gains external/provider dependencies;
- CI becomes flaky, unavailable, or diverges materially from the repository-declared toolchain;
- important checks require a platform/runtime that GitHub-hosted CI does not represent;
- strong review repeatedly duplicates deterministic evidence without distinct findings;
- a new failure class repeatedly escapes current tests/review;
- shared-interface integration checks add ceremony without preventing real omissions;
- OMP gains stronger runtime-enforced reviewer/read-only semantics;
- external systems make read-back/idempotency evidence central to normal work.
