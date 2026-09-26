# Delegation and persistent workers

The director owns user intent, task boundaries, shared interfaces, acceptance,
escalation and integration decisions. Workers own scoped exploration, editing,
local debugging and verification evidence for their assigned work. Optimize useful
accepted work, not hours spent waiting or a fixed token-share target.

## Select by task, not by a mandatory escalation ladder

Use `luna-code` for clear local/pattern-based changes, `luna-deep` for difficult
cross-file work, `luna-doc` for documentation/config synthesis and `sol-review`
for an independent high-risk review. Resolve these from the live agent catalog;
never assume an unavailable agent or tool exists.

The agent files route through logical OMP model roles: `luna-code` and `luna-doc`
use `@fast_worker`, `luna-deep` uses `@good_worker`, and `sol-review` uses
`@review`. Concrete model IDs and effort remain in `modelRoles` configuration,
so model-generation upgrades do not require rewriting omp-kit agents.

Give each workstream an immediate objective, allowed scope, context references and
completion evidence. Do not restate long discussions the worker can retrieve.
For important invariants or ambiguous behavior, give explicit acceptance criteria.

Use one owner for each writable scope. Concurrent independent work is useful;
concurrent overlapping edits require isolation or a serialized integration plan.
A director checking evidence should not repeat the entire worker investigation.

If a workstream changes a shared type, schema, catalog, interface, configuration
contract or similar cross-slice surface, Main owns the consumer/integration question.
Before acceptance, account for likely production call sites, tests/fixtures,
mocks/fakes and contract-facing docs/examples. A worker that discovers an out-of-scope
consumer reports it; it does not silently expand writable scope. Main may deliberately
reassign that consumer or handle it during integration.

At integration, compare the actual changed files with the scopes that were assigned.
Unexpected or overlapping writes are explicit integration findings rather than an
implicit change to worker ownership.

## Lifecycle

Use OMP's ordinary `task` tool to launch the chosen custom agent. Record its actual
returned id, scope and expected evidence. Results and peer messages auto-deliver;
use `wait` only when there is no other useful work. Use `read proc://` for a
non-consuming job/service status snapshot, `write agent://<id>` for a checkpoint
message, and `write proc://<id>/kill` to cancel a specific job. Consult the live
schema rather than guessing a coordination command. Do not promise persistence
after an unverified restart/park/revival path. If the worker cannot be revived,
launch a new one with a concise checkpoint and known context references.

Avoid repeated status reads and needless supervisor wakeups. If built-in Vibe is
being used instead, load `vibe-compat.md`; `vibe_wait` is not the ordinary wait tool.

## Time budget and supervision

A delegated task should have a rough **first-checkpoint window** chosen from its shape,
not an exact completion promise. Use a simple bucket rather than false precision:

- **quick** — local edit/doc/config or one narrow check: about 2 minutes;
- **standard** — scoped implementation plus targeted tests: about 5 minutes;
- **deep** — cross-file debugging/refactor or several dependent checks: about 10 minutes.

Known slow builds, installs or external services may justify a longer window based on
observed baselines. The estimate is for supervisor cadence only; it is not a requirement
for the worker to sacrifice correctness or skip decision-critical verification.

OMP 18.3.0+ `wait` returns on the first owned job result, incoming peer message or
steering interrupt. Otherwise it has a single 30-minute safety cap, not an
adaptive polling ladder or caller-configurable timeout. Results may auto-deliver
while Main does useful work. A task-shape checkpoint is an expectation to assess
at the next natural wakeup or useful-work boundary, **not** a scheduled wakeup:
a silent worker may remain uninspected until the 30-minute cap if Main blocks in
`wait`. Do not recreate a short polling loop to enforce these estimates. If
earlier intervention is essential, avoid a blocking wait and inspect
`read proc://` at a natural work boundary.

On the **first material overrun**:

1. inspect the non-consuming `read proc://` status once rather than repeatedly
   polling;
2. if the worker is still running without a delivered result, send one concise checkpoint
   request asking for progress, current blocker, next action and whether director help is
   needed;
3. if there is concrete new progress, grant one new bounded window appropriate to the
   remaining work.

Do not inspect another live agent by scraping its session file or repeatedly reading its
history just to infer whether it is busy; use coordination/status surfaces and ask the
worker directly. History remains useful for completed evidence and context retrieval.

On a **second comparable overrun**, or sooner when the checkpoint reports stagnation:
ask the worker to yield partial findings, clarify/split/escalate the task, or cancel the
specific background job if continued execution has no justified next step. Do not keep
extending the same blocked approach. Cancellation is an intervention tool, not an
ordinary completion path; preserve the worker's available evidence before replacing it.

These checkpoint windows complement, rather than replace, OMP runtime guards such as
soft request budgets or hard runtime limits. Do not lower global guards from one slow
experiment; collect real request/session-span evidence first.

## Escalation and verification

Follow the worker's bounded repair budget. Two materially different failed attempts
on the same unresolved blocker trigger a report, not a new infinite agent loop.
The director may clarify scope, split the problem, change tier or ask the user.
Track provider retries, technical repairs, escalation and user scope changes separately.

Workers own verification evidence for their scope. Use focused checks while debugging
and before handoff. Do not mechanically run the same repository-wide full gate in every
worker just because it is cheap; repeated full-gate output and model/tool turns are still
overhead, and a shared working tree may change before acceptance.

A worker-local full gate remains useful when it answers a distinct diagnostic question,
when an isolated worktree needs a pre-merge safety check, when the worker owns the exact
final tree and its pass can be reused as final acceptance evidence, or when Main asks for
it explicitly.

The director owns the integrated verification result, but can delegate command execution
to a suitable verifier. After related workstreams settle and the accepted tree is
integrated, run the normal full deterministic gate once when it is cheap and relevant.
That integrated pass is the mechanical acceptance gate. If later fixes materially
change the tree, rerun only the checks required by the changed state rather than by a
phase ritual.

Independent review remains selective by failure cost. When practical, mechanically
verify the integrated diff before strong review so reviewer effort is spent on semantics,
lifecycle, product judgment, ambiguity and other risks not already decided by cheap
checks. Routine changes do not require a separate expensive review by default.

Return material product preferences, irreversible architecture choices and destructive
operations to the user. Ordinary implementation choices may follow repo conventions.
