# Execution cadence

Begin with the immediate objective, constraints and required evidence. Inspect the
relevant existing conventions, then make the smallest complete in-scope change.
Add behavior-focused tests for changed behavior; run targeted verification and
report observed results, not inferred success.

For coordinated work, load `delegation.md` and `subagent-context.md`. Delegate
coherent workstreams, reuse their owner when possible, and avoid rewriting a long
parent discussion as an expensive new brief. Workers verify their own scope and
return the evidence needed for integration.

## Worker verification and integrated acceptance

Use focused checks while implementing or debugging. A worker should normally run the
narrowest checks that can falsify its own change and report those results with the
handoff.

Do **not** run the same repository-wide deterministic gate in every worker merely
because it is offline or cheap. Repeated full-gate output still consumes tool turns,
attention and integration time, and on a shared changing tree it can describe a state
that will not be accepted anyway.

A worker-local full gate is justified when it has a distinct purpose, for example:

- the full suite is needed to diagnose a cross-slice failure that focused checks cannot isolate;
- Main explicitly requests a worker-local full pass before handoff;
- an isolated worktree needs a full pass before a risky merge/integration decision;
- CI itself is unavailable or is the subject of the diagnosis.

Otherwise, after related work settles, Main/integration ownership reconciles the
combined tree and lets the repository's normal CI full gate evaluate the exact commit.
For omp-kit's native core, `.github/workflows/verify.yml` checks lockfile freshness,
runs `just verify`, and rejects tracked-file drift on a clean GitHub-hosted runner. A
successful run on the exact commit is the normal mechanical acceptance evidence; do not
repeat the identical full gate locally merely because ownership crossed a handoff.

If later integration, review fixes, or requirement changes alter behavior relevant to
the gate, the new commit receives a new CI run because the tree changed. Rerun affected
focused checks during repair as needed, but do not rerun an unchanged successful full
gate solely because another workflow phase label was crossed.

Local `just verify` remains useful as an optional pre-push check or when diagnosing CI.
Machine-specific OMP/runtime/profile claims still need the relevant local or released-
runtime verification because the repository CI deliberately does not exercise them.

If full project verification is slow, externally metered, destructive, or otherwise
expensive, choose a proportionate integrated acceptance strategy and use focused checks
where possible.

Documentation-only workers without an execution tool report that limit; they do not
need to request a separate local verifier when the repository CI owns the applicable
full deterministic gate.

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
