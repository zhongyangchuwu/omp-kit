# Execution cadence

Begin with the immediate objective, constraints and required evidence. Inspect the
relevant existing conventions, then make the smallest complete in-scope change.
Add behavior-focused tests for changed behavior; run targeted verification and
report observed results, not inferred success.

For coordinated work, load `delegation.md` and `subagent-context.md`. Delegate
coherent workstreams, reuse their owner when possible, and avoid rewriting a long
parent discussion as an expensive new brief. Workers verify their own scope.

The integrating director owns final verification but may delegate its execution.
Run broad build/test/lint gates once when the integrated risk or acceptance calls
for them, not by default in every worker. Documentation-only workers without an
execution tool report that limit and request a suitable verifier.

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
