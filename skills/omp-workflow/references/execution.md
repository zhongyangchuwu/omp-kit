# Execution Cadence

## Execution inputs

Begin execution with the current objective, constraints, relevant repository facts, and verification expectations. Read existing conventions before writing new code.

For delegated work, do not require the director to restate context that a worker can retrieve directly. Use `delegation.md` for worker selection and lifecycle, and `subagent-context.md` for deciding whether to send direct context, reference parent history, or provide an explicit contract.

## Implementation cadence

1. Confirm the next bounded task.
2. Inspect the exact files and symbols needed to identify a credible implementation path.
3. Make the smallest complete change that satisfies the task.
4. Add or update behavior-focused tests when behavior changes.
5. Run the focused check that proves the task.
6. Record deviations and evidence for integration.
7. When using TDD, state expected behavior, observe a failing focused check, implement the smallest working change, and refactor only while the check remains passing.

## Subagent coordination

Delegate coherent workstreams, not fragments that force repeated context reconstruction.

A worker task should communicate the immediate objective and boundaries. Add explicit files, constraints, or acceptance criteria when they materially reduce ambiguity; do not mechanically rewrite the entire parent conversation into every brief.

Workers retrieve repository context themselves and may retrieve parent discussion according to `subagent-context.md`. Reuse the same persistent worker for follow-up implementation while its context remains relevant.

Workers run scoped verification. Project-wide build, test, lint, formatting, or release gates belong to the integrating controller unless the assignment explicitly delegates one of those gates.

The controller integrates results and verifies the minimum critical evidence necessary to trust them. It should not repeat the worker's entire exploration merely to increase confidence.

## Long-lived processes

When execution starts a server, watcher, job, browser, worker, tunnel, or other long-lived process, record ownership, target identity, readiness signal, logs or health check, and cleanup before trusting end-to-end evidence.

## Execution summary

Return the files changed, behavior changed, focused tests or checks run, deviations from plan, and unresolved risks. The summary should support integration without requiring the controller to reconstruct the worker's full investigation.
