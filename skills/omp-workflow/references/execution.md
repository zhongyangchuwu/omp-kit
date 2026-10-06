# Execution and verification ownership

Start from the assigned objective, constraints and required evidence; inspect relevant conventions and make the smallest complete in-scope change. For coordination, load `delegation.md` and `subagent-context.md` as needed.

## Integrated verification

Main owns builds, tests and smoke checks, including focused checks and the integrated gate. Workers do not run them; provide implementation evidence and report relevant risks or execution limits. After related work settles, Main reconciles the combined tree, selects proportionate checks and uses the repository CI gate for the integrated candidate. Machine-specific OMP/runtime claims need an appropriate smoke check when Main determines one is required. Documentation-only scope does not require a separate verifier before that integration.


## Integration before strong review

Before final acceptance, compare actual changed files with the writable scopes that were
assigned. Unexpected or overlapping writes are an integration decision for Main, not a
reason for workers to silently redefine their own scope.

When a shared type, schema, catalog, interface, configuration contract, or other
cross-slice surface changes, inspect likely consumers before acceptance:

- production call sites;
- tests and fixtures;
- mocks and fakes;
- contract-facing docs/examples;
- the explicit owner responsible for cross-slice integration.

Workers report out-of-scope consumers to Main/integration ownership. They do not chase
those consumers with unplanned writes unless Main deliberately reassigns the scope.

Independent strong review is selected by failure cost, ambiguity and the value of a
second judgment. When practical, wait for mechanically clean CI evidence and give the
reviewer the integrated diff plus requirements and existing evidence. Use strong review
for semantics, lifecycle, product behavior, security/accessibility, ambiguity and other
risks that deterministic checks do not cheaply decide.

Use the bounded-executor repair and stop contract for implementation. A blocked
worker should return evidence, attempted approaches and its best diagnosis.
Do not spend more autonomous turns repeating failed variants without new evidence.
A repeated command timeout is not new evidence by itself: change the diagnostic
approach, narrow the command, or escalate instead of simply increasing the wait.

For tests, builds or commands that are expected to take noticeable time, use an
observed baseline when one exists. Prefer the narrowest check that can answer the
current question, and use a bounded timeout/readiness condition when the available
tool supports one. Distinguish these outcomes explicitly:

- the command failed;
- the command timed out before a result;
- the command is intentionally long-running and reached an expected readiness signal.

Do not convert a timeout into a pass or automatically rerun it with a much larger
limit. One justified extension is reasonable when there is concrete progress or a
known slow baseline; repeated extensions without new evidence should escalate.

For a server, watcher, tunnel or other long-lived process, record ownership,
readiness signal, logs/health check and cleanup. Do not claim end-to-end readiness
before those dependencies are actually checked, and do not wait indefinitely for a
readiness event that has no bounded timeout.
