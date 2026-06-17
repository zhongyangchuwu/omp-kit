# Execution Cadence

## Execution inputs

Begin execution with the current goal, constraints, plan, relevant files, and verification expectations. Read existing conventions before writing new code.

## Implementation cadence

1. Confirm the next bounded task.
2. Inspect the exact files and symbols involved.
3. Make the smallest complete change that satisfies the task.
4. Add or update behavior-focused tests when behavior changes.
5. Run the focused check that proves the task.
6. Record deviations and evidence for the summary.
7. When using TDD, state expected behavior, observe a failing focused check, implement the smallest working change, and refactor while the check remains passing.


## Subagent coordination

Use subagents for independent work units with explicit files, constraints, outputs, and acceptance criteria. Keep shared context lean and written. The controller integrates results and runs final verification.
Subagents do not run project-wide build, test, lint, or formatting gates. They report scoped evidence; the controller verifies the integrated result.

## Long-lived processes

When execution starts a server, watcher, job, browser, worker, tunnel, or other long-lived process, record ownership, target identity, readiness signal, logs or health check, and cleanup before trusting end-to-end evidence.


## Execution summary

Record the files changed, behavior changed, tests or checks run, deviations from plan, and unresolved risks. The summary must support review and verification without relying on conversation memory.
