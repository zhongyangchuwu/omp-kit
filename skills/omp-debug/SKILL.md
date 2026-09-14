---
name: omp-debug
description: Use when diagnosing failing tests, runtime errors, flaky behavior, regressions, hangs, performance anomalies, incorrect outputs, integration failures, or unknown root causes; provides a root-cause debugging loop and evidence handoff.
---

# OMP Debug

## Focus

OMP Debug owns systematic diagnosis for unknown-cause failures. It turns symptoms into observed evidence, tests one hypothesis at a time, fixes root causes rather than symptoms, and hands the resolved behavior to verification.

## Activation

Use this skill when the task involves:

- failing tests, builds, commands, CI jobs, or runtime paths;
- exceptions, crashes, hangs, flakes, races, timeouts, or performance anomalies;
- incorrect output, missing state, stale state, or inconsistent behavior;
- regressions after a change, dependency update, migration, or environment shift;
- unclear root cause after one or more attempted fixes;
- production or integration failures where mitigation and root-cause work must stay distinct.

## Workflow

1. Capture the symptom, expected behavior, failing command or path, and current evidence.
2. Reproduce the failure or state exactly what observation proves it exists.
3. Inspect recent changes, working examples, environment, configuration, inputs, and component boundaries.
4. Form one explicit hypothesis and run one discriminating check.
5. Trace bad data, state, or control flow back to the original trigger.
6. Apply one root-cause fix; label emergency mitigations as mitigations, not fixes.
7. Re-run the original failing path and hand regression evidence to verification.

## Rules

- Do not patch before observing enough evidence to name a plausible root cause.
- Do not stack multiple speculative fixes; one variable changes per experiment.
- Distinguish symptom, trigger, root cause, mitigation, and final fix.
- Fix the earliest source that makes the bad state possible, not only the line that throws.
- Use condition-based waiting for async failures; arbitrary sleeps require a documented timing reason.
- After repeated failed fixes, stop and re-examine the model, architecture, or assumptions before patching again.
- Debug output records what was observed, what hypothesis was tested, and what evidence changed the conclusion.

## Support files

| Need | Load |
| --- | --- |
| Main diagnosis loop | `references/debugging-loop.md` |
| Backward data and call-chain tracing | `references/root-cause-tracing.md` |
| One-hypothesis experiment discipline | `references/hypothesis-testing.md` |
| Flakes, races, hangs, and async waits | `references/async-and-flakes.md` |
| Validation and guards after root cause | `references/defense-in-depth.md` |
| Regression evidence and handoff | `references/regression-evidence.md` |
