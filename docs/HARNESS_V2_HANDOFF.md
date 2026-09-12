# Harness v2 implementation handoff

## Current state

Harness v2 has completed the bounded runtime-validation sequence on the current Linux/WSL2 + OMP 18.1.18 path. Installation/config/profile behavior is locally validated, and all four runtime merge gates now pass.

Installer/config validation baseline:

```text
installer tests: 50 passed
root tests:      88 passed
validate-harness: passed
check-registry:   passed
validate-registry: passed
git diff --check: passed
```

Runtime gates:

```text
Phase 1: restricted luna-code viability        PASS
Phase 2: real history://Main retrieval          PASS
Phase 3: persistent same-session continuation   PASS
Phase 4: Notes-backed rollover/recovery         PASS
```

Read `docs/VALIDATION.md` for evidence/limits and `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the completed smoke sequence, context-policy smoke and merge gate.

## Goal

Maintain a portable personal OMP harness that uses strong models for high-leverage control decisions and inexpensive restricted workers for token-heavy execution, while preserving reproducible configuration, bounded autonomous behavior, measurable context transfer and recoverable installation.

## Source priority

For current behavior, prefer:

1. current `config/`, `agents/`, and `skills/` — executable/runtime policy;
2. `docs/VALIDATION.md` — what has actually been tested;
3. `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` — completed gates and active policy smoke;
4. `README.md`, `docs/omp-installation.md`, `docs/omp-configuration.md` — operational use;
5. `docs/HARNESS_V2_GUIDE.md` — architecture rationale.

Earlier chat snippets and historical reports are design evidence, not current instructions. A new OMP session cannot assume that a separate prior session is available through its own `history://Main`.

## Stable implementation surface

- Canonical user-derived config/models using CPA `/v1`, `openai-responses`, and `CPA_API_KEY`.
- Sol control-plane / Luna workforce role mapping.
- Four role-backed restricted workers, including `luna-code` and `luna-deep`.
- `bounded-executor` for scope/repair/stop discipline.
- `omp-workflow` delegation and subagent-context policy.
- Portable copy installer with dry-run, drift detection, backups, rollback, profiles, local overlays and offline doctor.
- Native OMP root/profile handling aligned with current OMP path/profile semantics.
- Notes-backed context enabled in the canonical default configuration, with legacy-context overlay available.

Do not redesign these layers without evidence of a concrete failure.

## Runtime conclusions

### Phase 1 — restricted worker

`luna-code` matched bundled `sonic` at 5/5 independent passes on five bounded fixtures. It showed a narrower enabled tool surface, shorter session-init prompt, fewer observed tool calls/reads, lower aggregate total tokens and lower aggregate wall time. The token reduction was dominated by cache-read tokens, so it is not a direct Business-quota claim. Decision: keep `luna-code` unchanged.

### Phase 2 — Main-history retrieval

A real Main session -> `history://Main` -> one `luna-code` worker path recovered all accepted decisions, excluded superseded/rejected/unresolved material, grounded a repository fact and passed independent scoring. The child used 200,731 total tokens in that long-session smoke, which is a signal to prefer targeted retrieval over default whole-history reads, not a correctness failure.

Synthetic parents held open with long `hub wait` were discarded as invalid scaffolding. When downstream work depends on parent history, use a history barrier instead of equating message delivery with durable transcript availability.

### Phase 3 — persistent continuation

One `luna-code` session handled three related tasks across two direct follow-ups. The worker was observed `idle` after each task and the two continuations reported `woken`; no silent respawn/fallback occurred. Task 3 correctly followed a new decision that superseded an earlier behavior. This proves same-session continuation / idle wakeup, not a separately demonstrated `parked -> revived` transition.

### Phase 4 — Notes-backed rollover

Main persisted accepted/superseded/open state into context notes, entered a new context with `new_context`, received the notes-backed state automatically, recovered exact pre-rollover evidence through targeted `history://current/full` lookup, and correctly completed a decision-dependent task. Independent tests and direct behavior checks passed.

Known tooling anomaly: `context_notes` documentation says omitting `text` reads the notebook, while the currently exposed schema requires `text`; an empty string clears the notebook. This was reported through `xd://report_issue`. Automatic notes injection and full-history recovery still worked, so the runtime gate remains satisfied. Avoid empty-string `context_notes` reads.

## Context-policy decision

The workflow now separates session delegation context from durable planning:

```text
current task      -> dispatch
implementation    -> repository facts
same-session talk -> history://<parent>
cross-session     -> deliberate .planning/ artifacts
rollover in Main  -> context notes
```

`history://Main` is an automatic concise transcript of the current Main session; Main does not maintain a second history document for workers. For Referenced tasks, workers should `grep` the parent transcript first and use targeted line-range reads. Whole long-transcript reads are fallback behavior only.

`.planning/` remains the durable project-state mechanism when work must survive a fresh OMP session or deliberate multi-phase workflow. It should materialize accepted/current state, not copy the conversation transcript. Do not create a default `SESSION.md` mirror or mandatory context-capsule subsystem.

See `skills/omp-workflow/references/subagent-context.md` and `skills/omp-workflow/references/context-and-plan.md` for the active policy.

## Immediate next action

Run exactly one **search-first parent-history smoke** before final branch review.

Use a real Main discussion with accepted, superseded, rejected and unresolved material. Dispatch one `luna-code` worker with only objective, fixture/scope, `history://Main` and a few topic hints. The worker must `grep` the parent transcript and read only relevant surrounding ranges; an unbounded whole-history read invalidates the intended policy test unless targeted retrieval demonstrably failed.

Independently verify decision interpretation and behavior. Record actual agent/model, grep patterns, targeted history ranges, any whole-history read, correctness, child tokens and wall time if readily available. One clean pass is enough; do not create another benchmark framework.

If it passes, stop context experimentation and perform final branch review before deciding whether to merge `harness-v2-implementation` to `main`.

## Constraints

- Do not commit keys, `.env`, auth stores, backups, raw session logs or account-specific state.
- Do not grant another machine's setup/QA consent.
- Preserve the canonical CPA transport and model definitions unless measured runtime evidence requires a change.
- Do not claim a custom agent has a minimal provider-facing system prompt; current OMP still constructs a substantial child harness.
- Tool restriction reduces action-space complexity but is not security isolation.
- Do not infer ChatGPT Business quota from configured API-equivalent prices or raw token totals.
- Worker self-report is not verification; use independent acceptance checks where failure matters.

## Merge direction

The installer/config gate and bounded runtime gates are satisfied. Multi-hour endurance/quota work is deferred and should not block merge.

Before merging `harness-v2-implementation` to `main`:

1. run the one search-first parent-history policy smoke;
2. record the result and any concrete defect;
3. perform final branch review;
4. merge only if no new high-severity defect is found.

## Deferred until evidence requires them

No OMP fork, custom scheduler, raw cross-agent full-history API, automated context curator, pricing service, replacement minimal system prompt, complex experiment framework or mandatory decision-capsule subsystem. Add one only when an observed failure or repeated manual cost justifies it.
