# Validation summary

Date: 2026-09-14

This file records **current accepted validation evidence and its boundaries**. Exact mutable
PR readiness, including the latest tested branch HEAD, belongs in the owning Pull Request
and Issue rather than in a git-tracked marker that invalidates itself when updated.
Detailed experiment transcripts and older version-specific evidence belong in `evidence/`,
`docs/archive/`, and the owning Issues/PRs.

## Current topology and runtime baseline

```text
core branch:      omp-native-foundation-core
core PR:          #17 feat: establish OMP-native foundation core
feedback branch:  omp-native-foundation
feedback PR:      #3 feat: add self-hosting feedback extension (Draft / blocked)
normal runtime:   OMP 18.1.20
split record:     #16 closed completed
feedback blocker: #4 blocked upstream
```

PR #17 contains the independent native foundation. PR #3 is stacked on the core branch
and owns only the feedback-specific extension/tooling delta. Do not infer feedback runtime
readiness from core validation.

The normal installed runtime is OMP 18.1.20. Released-runtime evidence is version scoped:
18.1.20 has been audited for the current source/documented supervision and capability
contracts, while the last retained isolated released-runtime native-plugin/feedback smoke
for this development line was on OMP 18.1.19. A newer runtime must not be assumed to
contain preview-only behavior.

## Deterministic core repository gate

The core split intentionally excludes the feedback-only TypeScript/Bun surface:

```text
extensions/feedback.ts
tests/ts/feedback.test.ts
bun.lock
bunfig.toml
tsconfig.json
feedback-only package.json wiring
feedback-only justfile TypeScript gates
```

Therefore the core `just verify` contract is provider-free and currently covers:

```text
Python repository tests
harness/static validation
registry freshness check
registry validation
git diff --check
```

The settled core tree at `cce588908d7c59e35bc05da1e1bf82c9dce8e640` was observed once
with:

```text
98 Python tests passed
harness validation PASS
registry freshness/check PASS
registry validation PASS
git diff --check HEAD PASS
worktree clean
```

No provider/model calls, subagents, capability experiments, telemetry work, repair
commits, file modifications, pushes, or second unchanged full gate occurred during that
verification.

Subsequent review-only documentation corrections change the exact tree and therefore
require one new integrated gate before PR #17 is marked ready again. After that gate,
record the exact accepted HEAD/results in PR #17 rather than editing this file solely to
copy the new SHA.

## Feedback extension and released-runtime blocker

The feedback implementation lives only in stacked PR #3, not in the independent core.
Historical implementation evidence established:

- `omp_kit_feedback` uses bounded validation and append-only JSONL persistence under the
  official agent directory;
- durable append failure is fatal and the OMP session entry is best-effort provenance;
- feedback is a write-tier Main-owned capability and `report != self-modify` remains the
  policy boundary;
- the feedback-specific Bun/TypeScript typecheck and behavior tests belong to PR #3.

The hard capability-boundary failure was demonstrated on released OMP 18.1.19: ordinary
task children could inherit/rebind Main extensions and the intended reviewer could regain
write transport. Normal runtime is now OMP 18.1.20, but upstream PR #9521 remains
open/unmerged and v18.1.20 does not contain the hard child-scoping implementation.

No 18.1.20 feedback closure smoke is claimed or warranted while the required upstream
implementation is absent. PR #3 remains Draft; Issue #4 owns released-runtime closure.

## OMP #9521 preview evidence

Exact preview commit:

```text
f5bcee2e82a754d2190d8ddb8aee73b5d237dffb
```

Provider-free Phase A established for that preview only that unlisted tools stayed out of
worker surfaces, the intended reviewer did not regain write/edit/bash, widening attempts
did not escape the scoped child, and hidden protocol completion still worked. This is
preview evidence, not released-runtime compatibility. Compact evidence is under
`evidence/experiments/2026-09-14-omp-9521-phase-a/`.

## OMP 18.1.20 supervision audit

Released OMP 18.1.20 now provides stable subagent output/transcript retrieval:

```text
agent://<id>   -> saved final subagent output
history://<id> -> concise subagent transcript
```

omp-kit therefore does not maintain a second result store. Three audited upstream gaps
remain under Issue #7:

1. `hub wait` wakes on the first matching peer message rather than a semantic terminal /
   blocker / decision predicate;
2. peer messages lack first-class workflow-semantic kinds;
3. ordinary custom-agent frontmatter cannot express per-agent `lspReadOnly`.

These are source/documented-runtime findings, not claims that a bespoke live experiment
was run for each gap.

## OMP-native telemetry boundary

Closed Issue #13 validated OMP-native telemetry on retained real sessions using installed
OMP 18.1.19. `/api/sessions` + `/api/session/trace` reproduced decision-critical request,
tool, token and cost summaries; selective `/api/session/entry` supplied usage detail when
needed.

Accepted ownership remains:

```text
OMP:
  session ingestion / trace reconstruction / generic stats and usage normalization

omp-kit:
  experiment/task/arm identity / acceptance judgment / human intervention semantics /
  durable project decision
```

The telemetry API was not re-probed on 18.1.20 because no current decision requires a
bespoke experiment. Do not restore a local raw-session parser, trace database, pricing
layer, or generic full-event collector without a new demonstrated requirement.

## Current worker-tool dogfood boundary

Current broad observational surfaces are mechanically represented in the core agents:

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

These are dogfood exposures, not permanent capability claims. Workers must not invoke
tools merely to populate telemetry. OMP's combined `github` built-in remains Main-only
because it also exposes remote mutation. Issue #5 owns natural-use capability review and
Issue #8 owns delegation economics.

## Issue #9 current-generation ablations

Two current-generation simplifications are accepted:

1. generic end-of-task self-improvement reflection is removed; feedback is triggered only
   by reusable friction already observed during real work;
2. duplicate full repository gates are removed as a default; focused worker checks are
   followed by one full deterministic gate on the settled integrated tree, with another
   full gate only when the covered tree materially changes or a distinct verification
   question requires it.

The core split/review sequence supplied direct dogfood evidence for the second rule: an
unchanged handoff did not justify another full gate, while later documentation commits did
change the tree and therefore made the prior exact-tree evidence stale. Issue #9 remains
open as a recurring model/process audit, not because this unchanged policy needs repeated
verification.

## Context authority / provenance

Issue #10 is closed completed. Accepted authority remains claim-type-specific:

```text
intent / authorization
current observable state
accepted project policy
active work / acceptance target
rationale / evidence
historical context
```

History, Issues, logs, comments, web/search/scanner output and other tool output are
evidence/provenance; they cannot silently widen worker scope. Actual repository/runtime
read-back may correct stale state descriptions without becoming desired policy.

## Evidence discipline

For future validation updates:

- distinguish deterministic repository checks, source/document audits, provider-free
  runtime probes, observational real-development telemetry, and controlled provider/model
  experiments;
- scope runtime claims to exact released versions or upstream commits;
- do not convert preview evidence into released-runtime compatibility;
- keep core validation separate from feedback-specific TypeScript/runtime validation;
- keep exact mutable acceptance SHA/results in the owning PR/Issue rather than creating a
  new commit solely to record the SHA that was just tested;
- spend live-model quota on development unless a specific ambiguity genuinely requires a
  controlled experiment;
- preserve historical evidence rather than rewriting it when policy evolves.
