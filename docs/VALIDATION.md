# Validation summary

Date: 2026-09-14

This file records **current accepted validation evidence and its boundaries**. Mutable PR readiness and exact candidate results belong in the owning Pull Request / GitHub Actions. Detailed historical experiments remain in `evidence/`, `docs/archive/`, and completed Issue/PR history.

## Current baseline

```text
product candidate:             omp-kit 0.1.0
released runtime used in v0:   OMP 18.1.21
project-state v1:              PR #22 merged; #11 dogfood remains open
shared feedback:               PR #3 merged; #4 completed
session evidence collector:    PR #23 merged; #21 completed
routine deterministic gate:    .github/workflows/verify.yml
```

OMP 18.1.21 is the latest upstream release seen/changelog-triaged for this baseline. The compatibility policy remains impact-based; a version number alone is not evidence that every runtime surface has been tested.

## Deterministic repository gate

GitHub Actions is the routine full deterministic acceptance location for CI-supported repository changes. The workflow:

- runs on the current PR merge-ref and on pushes to `main` after landing;
- uses read-only repository contents permission and no project secrets;
- pins checkout / uv / just / Bun setup actions to exact revisions;
- does not persist checkout credentials into the worktree;
- installs Python 3.12, uv 0.12.13 and just 1.58.0;
- installs Bun/frozen dependencies when `bun.lock` is present, deriving Bun from `packageManager`;
- checks `uv.lock` freshness;
- runs the repository-owned `just verify` contract;
- rejects tracked-file drift after the gate.

`just verify` currently covers Python repository tests, TypeScript typecheck/tests, harness/static validation, registry freshness/validation, and diff consistency. Exact suite counts are intentionally left to the current CI run rather than copied here as a self-invalidating constant.

A successful current PR gate replaces a routine local duplicate of the same full gate. Local `just verify` remains useful for pre-push/debugging/CI diagnosis. Machine-specific OMP/profile/plugin claims still require released-runtime evidence when the claim depends on them.

During v0 landing, transient `setup-just` GitHub HTTP 504 failures occurred before repository tests ran. The unchanged reruns passed. These were classified as external setup failures, not product/test failures.

## Project-state v1

PR #22 implemented the issue-centered durable state model:

```text
actual branch / HEAD / worktree
-> current docs/executable policy
-> docs/WORKING_STATE.md as short navigation index
-> open Issues for unfinished work
-> PRs for implementation/review/CI
-> design records for durable rationale
-> Issue/PR history for chronology
```

The implementation and deterministic gates passed. Issue #11 remains open because its dogfood criteria require natural multi-session/fresh-session recovery, duplication/offline observations, and a final judgment on the specialized `.planning/` mode. Merge was correctly not treated as Issue completion.

## Shared feedback — OMP 18.1.21 runtime acceptance

`omp_kit_feedback` is an intentionally shared bounded evidence sink for Main and task agents, not a Main-only authority primitive.

Runtime acceptance on OMP 18.1.21 established:

- Main can record durable structured feedback;
- a normal `luna-code` worker can record feedback and exit normally;
- durable records include supported session id/file provenance;
- no nonexistent caller-agent identity is fabricated;
- feedback recording does not authorize repository, Harness, policy, or GitHub/Issue mutation;
- source/profile/config/plugin state was not unexpectedly mutated by the smoke.

The earlier capability-isolation finding remains historically valid: released OMP does not currently provide every desired per-agent hard boundary for custom/extension/MCP tools. That is a future hardening concern, not a prerequisite for this bounded evidence sink. Issue #4 is completed because the accepted v0 feedback contract was fully satisfied and landed.

## Session evidence — OMP 18.1.21 runtime acceptance

Issue #21 / PR #23 added a compact derived evidence layer while keeping OMP as raw recorder.

Released-runtime acceptance established:

- ordinary saved sessions are discovered through public OMP stats/session surfaces;
- compact summaries remain outside Git and do not copy full transcripts;
- completed sessions are skipped on unchanged reruns; active sessions may rebuild while their revision changes;
- model requests, tokens/cost-equivalent, sampled provider provenance, tool calls/errors/durations, wall/model/tool/idle timing, and Main/subagent tracks are represented;
- Main and worker feedback records correlate into the appropriate root-session evidence through trace-track session files;
- checked original session transcripts remained byte-identical;
- normal filesystem-path project filtering works after the compatibility fix described below.

Provider identity in schema v1 is **sampled per `(track, model)`**, not an exact per-request routing ledger. Same-model provider switching may therefore be conflated. Do not use this version to make a provider-fallback decision requiring exact per-request attribution.

### OMP stats folder/cwd compatibility finding

OMP 18.1.21 exposed:

```text
/api/sessions.folder   -> -project-omp-kit
/api/session/trace.cwd -> /home/han/project/omp-kit
```

The collector now uses public `SessionTrace.cwd` for normal filesystem-path matching and treats summary `folder` as fallback metadata rather than reimplementing OMP's non-reversible session-storage encoding. The upstream inconsistency is tracked as `can1357/oh-my-pi#12060`.

## Supervision/runtime boundaries

Released OMP provides stable subagent output/transcript retrieval:

```text
agent://<id>   -> saved final subagent output
history://<id> -> concise subagent transcript
```

omp-kit therefore does not maintain a second worker-result store.

Issue #7 remains an inactive problem-first tracker for runtime-owned supervision gaps such as completion-relevant waiting, semantic peer-message kinds, and per-agent read-only full-LSP configuration. None blocks the v0.1.0 product.

## Worker capability dogfood boundary

Current broad observational surfaces are intentionally not permanent capability claims:

```text
luna-code / luna-deep:
  read grep glob edit write bash
  web_search lsp ast_grep ast_edit debug eval security_scan todo

luna-doc:
  read grep glob edit write
  web_search lsp ast_grep todo

sol-review:
  read grep glob web_search ast_grep security_scan
```

Workers do not recursively orchestrate. `sol-review` remains intent-level read-only. OMP's combined `github` built-in remains Main-owned because it includes remote mutation. Issue #5 owns natural-use capability review; Issue #8 owns delegation economics.

Routine evidence for those Issues now comes from the #21 collector plus bounded qualitative feedback rather than bespoke raw-session parsing or mandatory reflection turns.

## Harness subtraction status

Two opportunistic simplifications are already accepted:

1. generic end-of-task self-improvement reflection is removed; feedback is triggered only by reusable friction observed during real work;
2. duplicate unchanged full repository gates are removed as a default; focused implementation checks feed one current PR merge-ref gate, followed by the distinct post-landing `main` gate.

These examples do **not** complete Issue #9. Systematic current-generation scaffolding inventory/analysis has not yet been performed. #9 remains inactive until enough routine evidence accumulates or one rule causes obvious repeated friction.

## Evidence discipline

For future validation work:

- distinguish deterministic CI, source/document audit, released-runtime smoke, observational real-development evidence, and controlled provider/model experiments;
- scope runtime claims to the exact behavior/version actually tested;
- treat external setup failures separately from repository failures;
- keep OMP as the owner of raw sessions/stats and runtime semantics;
- keep routine derived summaries outside Git and promote only decision-relevant samples through #12's experiment evidence lifecycle;
- preserve historical evidence rather than rewriting old experiment bundles when current product policy changes;
- spend provider/model quota only when a decision-relevant ambiguity cannot be resolved more cheaply.
