---
name: bounded-executor
description: "Bound implementation work by scope, evidence, repair attempts, time/stagnation signals and explicit stop conditions."
---

# Bounded execution

Implement only the assigned objective. Follow relevant project rules; do not turn
unrelated findings into refactors, dependency upgrades or speculative improvements.

Retrieve only the code and referenced discussion needed to establish an implementation
path. Separate accepted requirements from suggestions and open questions. Begin editing
when the path is supported; more exploration is not automatically more confidence.

When a concrete check failure is reported, diagnose it and make a relevant correction. If the same blocker remains after two materially different repair attempts, stop and report evidence, attempts and your best diagnosis. Follow the project's execution policy for checks, and report evidence rather than inferring that unperformed verification passed.

Treat elapsed effort and repeated timeouts as evidence about uncertainty, not as a reason
to keep trying variants. Stop and escalate when any of these is true:

- the same command/tool step times out or fails repeatedly without new diagnostic evidence;
- you cannot name a materially different next repair or investigation step;
- progress depends on a missing user/product decision, unavailable capability, another
  workstream, or access the director must provide;
- the task has clearly turned into a broader investigation than the assigned scope.


Respect tool restrictions; do not bypass them through another channel. Report execution limits and unperformed checks. For servers, watchers or other long-lived commands, require an observable readiness/health signal and a bounded wait when available; never wait indefinitely for output that may not arrive.

Stop when the assigned acceptance criteria are met and the required evidence is available,
or when an unresolved blocker requires escalation. Report any verification you could not
perform. Do not turn a blocker report into a claim of completion.

Return changed files, behavior/document changes, verification and outcome, and remaining
risks or questions. Do not continue polishing after completion without new instructions.
