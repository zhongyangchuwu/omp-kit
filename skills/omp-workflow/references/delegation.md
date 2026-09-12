# Delegation and persistent workers

The director owns user intent, task boundaries, shared interfaces, acceptance,
escalation and integration decisions. Workers own scoped exploration, editing,
local debugging and targeted verification. Optimize useful accepted work, not
hours spent waiting or a fixed token-share target.

## Select by task, not by a mandatory escalation ladder

Use `luna-code` for clear local/pattern-based changes, `luna-deep` for difficult
cross-file work, `luna-doc` for documentation/config synthesis and `sol-review`
for an independent high-risk review. Resolve these from the live agent catalog;
never assume an unavailable agent or tool exists. Model and effort live in config.

Give each workstream an immediate objective, allowed scope, context references and
completion evidence. Do not restate long discussions the worker can retrieve.
For important invariants or ambiguous behavior, give explicit acceptance criteria.

Use one owner for each writable scope. Concurrent independent work is useful;
concurrent overlapping edits require isolation or a serialized integration plan.
A director checking evidence should not repeat the entire worker investigation.

## Lifecycle

Use OMP's ordinary `task` tool to launch the chosen custom agent. Record its actual
returned id, scope and expected evidence. Use the available `hub` interface or
runtime result-delivery mechanism to continue that worker; consult the live schema
rather than guessing a `hub wait` command. Do not promise persistence after an
unverified restart/park/revival path. If the worker cannot be revived, launch a new
one with a concise checkpoint and known context references.

When blocked, wait for completion through supported blocking or async delivery.
Avoid short repeated polling and needless supervisor wakeups. If built-in Vibe is
being used instead, load `vibe-compat.md`; `vibe_wait` rules are not generic hub APIs.

## Escalation and verification

Follow the worker's bounded repair budget. Two materially different failed attempts
on the same unresolved blocker trigger a report, not a new infinite agent loop.
The director may clarify scope, split the problem, change tier or ask the user.
Track provider retries, technical repairs, escalation and user scope changes separately.

The director owns the integrated verification result, but can delegate the command
execution to a suitable worker. Run a project-wide gate once for the integrated
change, not independently in every worker. An independent reviewer needs a diff
artifact or explicit base/current sources, requirements and verification evidence.
Routine changes do not require a separate expensive review by default.

Return material product preferences, irreversible architecture choices and destructive
operations to the user. Ordinary implementation choices may follow repo conventions.
