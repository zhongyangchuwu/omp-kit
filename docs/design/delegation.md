# Delegation and bounded workers

## Problem

Delegation can help coding agents through parallelism, specialization, and context isolation, but it also creates specification, context-transfer, supervision, integration, review, and repair costs. Multi-agent architecture becomes counterproductive when the system delegates work that Main could finish more cheaply or when multiple role personas merely repeat the same assumptions without independent work/evidence.

omp-kit therefore needs delegation to be a route selected by task economics and boundaries, not a mandatory ceremony.

## Evidence

### Independent work is more meaningful than role-play

**Type:** external analysis / hypothesis.

The recent Harness discussion distinguishes `architect/critic/reviewer` personas reading the same context from genuinely independent work such as platform-specific implementations, performance tests, or security review. The latter creates independent evidence/workspaces and can run in parallel; the former can share the same wrong premise.

Reference: https://www.iconb.cn/article/0eec42eaeef142c5df5c5e1f88864592

### Strong judgment can enter the specification

**Type:** community report / anecdote.

Doug Colkitt reports personal bake-offs where a strong director/planner produced clear specifications/tests and cheaper/faster implementation models did not show material quality loss on sufficiently explicit worker tasks. The useful hypothesis is that system intelligence can enter through specification quality and acceptance criteria rather than requiring the implementation model to be equally expensive.

This is not a published benchmark; sample size/task distribution are not public.

Reference: https://zamantika.com/0xShual/status/2096440481630585128

### Continuous supervision can erase the economic benefit

**Type:** community report + counter-evidence.

Maker Jackie reports preferring separate plan -> implementation -> final acceptance sessions over keeping the strongest model alive to supervise a worker. LINUX DO discussion similarly reports expensive wait/poll overhead in one user's trace and raises the opposite failure mode: if the worker needs repeated repair, `delegate + review + repair` can exceed strong-model direct execution.

References:

- https://www.makerjackie.com/blog/2026-09-07-gpt6-astra
- https://linux.do/t/topic/2894195

These are useful mechanisms/hypotheses, not universal cost ratios.

### omp-kit worker viability experiment

**Type:** controlled project experiment (limited scope).

Phase 1 experiments compared bundled `sonic` with custom `luna-code` on five deterministic Python fixtures. Both arms passed 5/5 independent correctness checks; the custom worker showed lower observed total-token/tool/wall-time activity in that sample. The token difference was dominated by cache-read tokens and was explicitly not treated as a Business-quota claim.

The useful conclusions remain in [current validation](../VALIDATION.md). The complete original report is preserved at its [pre-cleanup Git revision](https://github.com/zhongyangchuwu/omp-kit/blob/47a2951f47c9c55ce8f8cb020220288f9e28f871/docs/archive/native-foundation/VALIDATION_PHASE1_2026-09-13.md).

This supports the viability of a restricted task-shaped worker. It does not establish that delegation beats Main-direct execution generally.

### Persistent-worker and context-transfer experiments

**Type:** controlled project runtime experiments.

The same validation established:

- a real `history://Main` worker could recover requirements correctly;
- one `luna-code` session successfully handled three related tasks across wakeups;
- search-first history retrieval preserved correctness but could still be context-heavy.

These results support bounded reuse and referenced retrieval, but also show that context transfer is not free.

### Zotero-Neo dogfood

**Type:** real-project dogfood.

Parallel workers with independent writable slices completed useful implementation/docs work without the design depending on fixed role personas. Integration/review then found real cross-slice concerns (catalog coverage, lifecycle guard, accessibility, locale-independent normalization). This supports independent scope ownership plus a separate integration responsibility.

The dogfood does not prove an overall token/cost advantage over Main-direct implementation because no controlled equivalent Main-direct run was performed.

## Interpretation

Delegation has value when one or more of these are real:

```text
parallelism
specialized capability
context isolation
independent evidence
bounded execution that is cheaper to specify and verify than to perform in Main
```

It loses when:

```text
specification cost
+ context-transfer cost
+ wait/supervision cost
+ integration cost
+ review/repair cost
>
Main-direct completion cost
```

The project should therefore optimize **accepted useful work**, not worker count or delegated-token ratio.

## Design principle

> Delegate only when the work is cheaper to specify and verify than to perform in Main, or when independence/parallelism creates value that Main-direct execution cannot.

Multi-agent independence should come from task/evidence/scope separation, not from assigning different personalities to agents that share the same assumptions.

## Current mechanism

`omp-workflow` has exactly three routing shapes:

```text
Main direct
one bounded delegate
parallel independent delegates
```

Main owns:

- user intent and task boundaries;
- routing and material judgment;
- shared interfaces and cross-slice integration;
- verification judgment and final acceptance/reporting.

Workers own bounded execution/investigation in their declared scope and do not create another orchestration layer.

For parallel writes:

- prefer one owner per writable scope;
- overlapping/out-of-scope consumers return to Main/integration ownership;
- workers may verify their own scope, but the integrated tree still needs its own acceptance gate;
- strong independent review is selected by risk, not made mandatory for every edit.

## Evaluation / observed effect

Current evidence supports the **shape** of the policy more strongly than its economics:

- restricted workers can be correct and materially lighter than a broader bundled worker in a small controlled fixture set;
- persistent same-session worker reuse can work;
- real dogfood shows independent slices are practical and integration ownership matters;
- context/wait overhead is measurable and can erase naive delegation benefits.

What is not yet established is a stable threshold for choosing Main-direct vs delegated execution across real repositories and changing model generations.

## Counter-evidence and limits

- A stronger Main may simply finish a task faster than specifying, waiting for, reviewing, and repairing a weaker worker.
- A worker benchmark on small deterministic fixtures does not represent large ambiguous repository work.
- Parallel workers sharing a changing working tree can invalidate each other's local verification evidence even without direct file overlap.
- A strong director/cheap worker mapping is model- and price-sensitive; core omp-kit agents therefore remain model-neutral.

## Current status

**Accepted routing/ownership design; delegation economics and model routing remain experimental.**

## Related implementation / Issues

- `../../skills/omp-workflow/`
- `../../agents/luna-code.md`
- `../../agents/luna-deep.md`
- `../../agents/luna-doc.md`
- `../../agents/sol-review.md`
- Issue #5 — worker capability matrix
- Issue #6 — parallel integration and verification
- Issue #7 — coordination/runtime gaps
- Issue #8 — delegation economics and model-routing decisions

## Revisit triggers

Re-audit delegation policy when:

- worker first-pass acceptance changes materially with new models;
- OMP changes subagent context/session/wait costs;
- real dogfood repeatedly shows delegation repair loops dominating useful work;
- Main-direct work becomes cheap enough that orchestration overhead dominates;
- new runtime primitives make independent execution substantially cheaper or more reliable.
