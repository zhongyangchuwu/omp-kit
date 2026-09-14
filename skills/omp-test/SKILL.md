---
name: omp-test
description: Use when designing, writing, modifying, or reviewing tests; defines behavior-focused coverage, regression checks, mock boundaries, edge cases, and task-subagent test handoffs.
---

# OMP Test

## Focus

OMP Test owns test authoring quality. It turns behavior claims into durable tests that protect contracts, regressions, invariants, edge cases, and meaningful failure paths without freezing incidental implementation details.

## Activation

Use this skill when the task involves:

- adding or modifying tests;
- writing regression tests for a bug fix;
- deciding what behavior a test should cover;
- choosing mock, fake, fixture, or harness boundaries;
- reviewing test code for value, brittleness, or missing coverage;
- delegating non-trivial test authoring to a task subagent;
- deciding whether existing tests are sufficient for a refactor.

## Workflow

1. Identify the public behavior, contract, invariant, or regression the test must protect.
2. Choose the narrowest meaningful execution boundary: CLI, API, component, function, persisted data, or integration path.
3. Cover representative cases, edge values, and failure behavior that would catch real regressions.
4. Use real code by default; mock only slow, external, nondeterministic, paid, or OS-level boundaries.
5. Main may delegate test authoring when independent coverage or parallelism justifies it. Otherwise write the tests directly. A worker follows its existing scope and spawn restrictions rather than starting another delegation layer.
6. Run the smallest command that exercises the new or changed tests and record the observed result.

## Rules

- Test behavior, contracts, invariants, and user-observable side effects.
- Do not test private plumbing, incidental call order, broad snapshots, or helper names unless the internal unit is itself a stable contract.
- Do not add production APIs, flags, exports, or reset hooks solely for tests.
- Regression tests should fail for the original bug when practical; if the fix already exists, state the observed reason red/green could not be captured.
- Fake data must match the real shape consumed by downstream code.
- A skipped test needs a concrete blocker and the narrowest replacement evidence available.
- Reuse applicable current-tree evidence and repository CI; do not repeat an unchanged passing full gate simply because a test handoff occurred.

## Support files

| Need | Load |
| --- | --- |
| Test selection and coverage shape | `references/test-design.md` |
| Mock and fake boundaries | `references/mock-boundaries.md` |
| Regression test discipline | `references/regression-tests.md` |
| Task-subagent test handoff format | `references/task-subagent.md` |
