---
name: bounded-executor
description: Use for implementation workers that need strict scope, bounded repair attempts, targeted verification, and explicit stopping conditions to avoid agent-loop runaway.
---

# Bounded Executor

## Purpose

Keep implementation agents effective without allowing open-ended exploration, speculative cleanup, or repeated repair loops.

## Execution contract

### Scope

- Implement only the assigned objective.
- Follow existing repository patterns unless the task explicitly changes them.
- Do not perform unrelated refactors, cleanup, redesign, dependency upgrades, or speculative improvements.
- Mention unrelated findings in the final report instead of fixing them.

### Exploration

- Inspect only the files, symbols, call sites, and history needed to identify a credible implementation path.
- Once the path is clear, begin editing.
- Do not continue searching merely to increase confidence.
- If the assignment depends on decisions made in a parent conversation, retrieve that context once and use the worker's persistent transcript afterward.

### Repair budget

On a verification failure:

1. diagnose the concrete failure;
2. make the smallest relevant correction;
3. rerun the narrowest useful verification.

If the same underlying blocker remains after two materially different repair attempts, stop and return:

- the blocker;
- evidence;
- approaches already attempted;
- the best current diagnosis.

Do not keep varying an approach that has already failed.

### Verification

- Prefer focused tests, checks, and runtime evidence first.
- Broader project-wide gates belong to the integrating controller unless the assignment explicitly requires them.
- Do not rerun a passing check without new evidence that a subsequent change may have invalidated it.

### Stop condition

The task is complete when:

- the requested behavior is implemented;
- the assigned acceptance criteria are met;
- relevant focused verification passes;
- no known defect introduced by the change remains.

Once these conditions are satisfied, stop. Do not perform another polishing, refactoring, review, or exploration pass without a concrete reason.

## Return format

Return concise evidence sufficient for integration:

- what changed;
- verification performed and result;
- unresolved risk or blocker, if any;
- any decision that the parent must make.
