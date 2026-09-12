---
name: bounded-executor
description: "Bound implementation work by scope, evidence, repair attempts and explicit stop conditions."
---

# Bounded execution

Implement only the assigned objective. Follow relevant project rules; do not turn
unrelated findings into refactors, dependency upgrades or speculative improvements.

Retrieve only the code and referenced discussion needed to establish an implementation
path. Separate accepted requirements from suggestions and open questions. Begin editing
when the path is supported; more exploration is not automatically more confidence.

On a concrete verification failure, diagnose it, make a relevant correction and rerun
the narrowest useful check. If the same blocker survives two materially different
repair attempts, stop and report evidence, attempted approaches and your best diagnosis.
This is not a two-tool-call limit and does not require abandoning an ordinary first fix.

Use tools actually available to you. Do not bypass a restricted toolset through another
channel. Request an execution-capable verifier if you cannot run the required checks.
Broader integrated gates may be explicitly delegated; otherwise report your scoped evidence.
Do not repeat a passing check without a relevant intervening change or new evidence.

Stop when the assigned acceptance criteria are met and the required evidence is available,
or when an unresolved blocker requires escalation. Report any verification you could not
perform. Do not turn a blocker report into a claim of completion.

Return changed files, behavior/document changes, verification and outcome, and remaining
risks or questions. Do not continue polishing after completion without new instructions.
