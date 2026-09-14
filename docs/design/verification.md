# Verification and acceptance

## Problem

Agent workflows can waste effort in two symmetric ways:

```text
insufficient verification
-> mechanical defects escape

ritual verification
-> equivalent full suites/reviews repeat across unchanged handoffs
-> extra tool turns, output, waiting and attention without new evidence
```

omp-kit needs evidence-driven acceptance without turning every worker handoff or phase boundary into another identical repository-wide test run.

## Evidence

### Mechanical evidence and model judgment solve different problems

**Type:** engineering argument + project dogfood.

Deterministic checks are good at falsifying mechanical contracts such as tests, types, generated registries and repository consistency. Strong review is more valuable for semantics, lifecycle, product intent, security, ambiguity and cross-slice reasoning that those checks do not encode.

Repeating either layer without changed state or a new question does not automatically add independence.

### Current deterministic gate is provider-free and CI-executable

**Type:** repository/runtime fact.

`just verify` is the repository-owned deterministic contract. The current v0 tree includes Python repository tests, TypeScript typecheck/tests, harness/static validation, registry freshness/validation, and diff consistency.

Issue #18 moved routine execution to `.github/workflows/verify.yml`. The workflow:

- uses read-only repository permission and no project secrets;
- checks `uv.lock` freshness;
- installs Bun frozen dependencies when `bun.lock` is present;
- runs repository-owned `just verify` rather than duplicating test logic in YAML;
- rejects tracked-file drift;
- runs once on the current PR merge-ref before landing and once on `main` after an authorized merge.

Current candidate results belong in GitHub Actions / the owning PR rather than this design record.

### Integrated acceptance ownership

**Type:** accepted project policy.

Issue #6 established that scoped worker verification is evidence while the accepted combined tree needs explicit integration ownership. Issue #9 later removed mechanical duplication of the same broad gate across worker handoff and integrated acceptance.

Current development deliberately prioritizes real omp-kit work over synthetic capability tests and redundant process. Local runtime effort is reserved for focused implementation checks, CI diagnosis, and claims that genuinely depend on installed OMP/profile/machine state.

### Runtime capability boundaries still matter

**Type:** project runtime audit.

The historical feedback audit demonstrated that a prompt-described read-only role is not equivalent to a runtime-enforced capability boundary. That conclusion remains valid after completed Issue #4 changed the feedback product decision.

The current v0 distinction is consequence-aware:

- `sol-review` remains intent-level read-only and does not receive ordinary mutation transports;
- remote-mutating `github` remains Main-owned;
- `omp_kit_feedback` may be shared with workers because it is a bounded evidence append whose output does not authorize or perform repository/policy/Issue mutation;
- stronger future OMP per-agent capability enforcement can harden surfaces, but its absence is not proof that every bounded reporting tool must be unavailable.

## Interpretation

Verification has several layers with different jobs:

```text
focused implementation evidence
  -> did this scoped change survive checks relevant to the change?

integrated deterministic CI gate
  -> does the accepted PR candidate / landed main tree mechanically satisfy repository contracts?

strong / independent review
  -> are semantic, lifecycle, product, security, ambiguity or cross-slice failures present?

external read-back / real-state evidence
  -> did an operation against the external world actually happen as intended?

local/runtime-specific evidence
  -> did behavior depending on installed OMP/profile/machine actually hold?
```

The objective is **minimum evidence duplication at the same acceptance strength**, not minimum testing.

## Design principle

> Prefer the cheapest evidence that can falsify the relevant failure mode, and do not collect the same evidence twice unless the state or question changed.

A broad gate answers a mechanical question about one concrete candidate tree. Once that tree changes materially, the answer may be stale. Before it changes, rerunning solely because work crossed a handoff/phase label usually adds little.

Strong model review should likewise add a different kind of evidence or judgment rather than restating a compile/test-clean result.

## Current mechanism

Default flow:

```text
implementation / debugging
-> focused checks that answer the current change
-> handoff with concrete evidence when delegation was used

related writes settle
-> reconcile actual writes and cross-slice consumers
-> review the current candidate semantically
-> GitHub Actions deterministic gate on current PR merge-ref
-> fixes, if any, produce a new candidate and therefore a new gate
-> authorized merge
-> main-push gate verifies the landed commit
```

### Worker-local full gate

A worker does **not** run the repository-wide full gate merely because it is cheap.

It remains appropriate for a distinct purpose, for example:

- an isolated exact final tree whose evidence is needed before push;
- pre-merge safety in an isolated worktree;
- cross-slice diagnosis that narrow checks cannot localize;
- explicit Main request;
- CI diagnosis.

On a shared changing tree, a worker-level full pass can describe a transient state and is poor evidence for the eventual accepted tree.

### Integrated full gate

After related writes settle, GitHub Actions is the normal repository-wide deterministic acceptance point for CI-supported work. It executes the repository-owned gate rather than maintaining a second implementation.

A successful PR merge-ref run is pre-merge mechanical evidence. Behavior-changing integration/review fixes stale that evidence and trigger another run. After merge, the `main` push gate answers the distinct landed-tree question.

Local `just verify` remains a useful pre-push/debugging command, not a mandatory duplicate of passing PR CI.

### Strong review

Independent review remains selective by failure cost, ambiguity and the value of a second judgment. Review should examine the actual current diff/tree and challenge product/contract assumptions that deterministic checks cannot decide.

The v0 landing sequence supplied concrete examples:

- #22 review caught a stale `WORKING_STATE.md` before merge;
- #3 required a fresh post-#22 merge-ref gate and distinguished an external setup failure from repository behavior;
- #23 was retargeted/rebased into a clean collector-only diff before final review;
- runtime evidence and CI were kept separate rather than allowing either to substitute for the other.

### Expensive, external or machine-specific verification

If verification is metered, destructive, slow, or machine-specific, use focused checks plus one proportionate acceptance strategy. External writes still require read-back/idempotency/state evidence; CI cannot prove external state.

Likewise, GitHub-hosted Linux does not establish installed OMP/profile/plugin behavior on the user's machine. The v0 shared-feedback and session-evidence claims therefore used explicit OMP 18.1.21 runtime acceptance in addition to CI.

## Evaluation / observed effect

The accepted verification architecture has reduced duplicate full-gate rituals while preserving meaningful boundaries:

- repository mechanical acceptance is automated and reproducible;
- behavior-changing candidate updates receive fresh merge-ref evidence;
- post-merge `main` gates remain distinct landed-tree evidence;
- runtime-specific claims are tested at runtime rather than inferred from unit tests;
- semantic review has caught stale-state and branch-topology defects that deterministic tests alone would not decide.

During v0 landing, `setup-just` twice received GitHub HTTP 504 responses before repository tests ran. The unchanged retries passed. Treating setup/network failures separately from product failures prevents both false confidence and unnecessary code churn.

## Counter-evidence and limits

- A worker-local full run can be high-value before an isolated/risky merge or for broad diagnosis.
- Passing CI does not establish UI usability, external-service state, runtime security properties or product semantics unless directly covered.
- High-consequence changes may require E2E/manual/external verification after the normal gate.
- Reducing duplicate runs must never become an excuse to ignore a failed/missing current integrated gate.
- GitHub-hosted Linux does not replace platform-specific checks when platform behavior is the claim.
- A green gate after an external setup retry is valid only when the repository candidate is unchanged and the failure clearly occurred before repository checks.

## Current status

**Accepted verification architecture.** Issue #18 completed routine CI execution. Issue #9 remains inactive until enough evidence exists for systematic process/scaffolding ablation; the two earlier simplifications do not complete that audit.

## Related implementation / Issues

- `../workflows.md`
- `../VALIDATION.md`
- `../../.github/workflows/verify.yml`
- `../../skills/omp-workflow/SKILL.md`
- `../../skills/omp-workflow/references/execution.md`
- `../../skills/omp-workflow/references/delegation.md`
- `../../agents/sol-review.md`
- completed Issue #4 — shared feedback/runtime capability evidence
- completed Issue #6 — integration/verification ownership policy
- Issue #8 — delegation economics / accepted useful work
- Issue #9 — systematic model-compensation/process ablation
- completed Issue #18 — GitHub Actions deterministic gate

## Revisit triggers

Re-audit when:

- focused checks repeatedly miss failures an earlier broad gate would catch materially sooner;
- repository verification becomes materially slower or gains external/provider dependencies;
- CI becomes flaky/unavailable or diverges from repository-declared toolchain semantics;
- important checks require a platform/runtime GitHub-hosted CI does not represent;
- strong review repeatedly duplicates deterministic evidence without distinct findings;
- a new failure class repeatedly escapes current tests/review;
- OMP gains stronger runtime-enforced reviewer/read-only semantics that change the desired capability surface;
- external systems make read-back/idempotency evidence central to normal work.
