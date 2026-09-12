# Harness v2 implementation handoff

## Current state

Harness v2 has completed the bounded runtime-validation sequence and the search-first parent-history policy smoke on the current Linux/WSL2 + OMP 18.1.18 path. Installation/config/profile behavior is locally validated, all four runtime merge gates pass, and the simplified context policy has one real worker proof.

Installer/config validation baseline:

```text
installer tests: 50 passed
root tests:      88 passed
validate-harness: passed
check-registry:   passed
validate-registry: passed
git diff --check: passed
```

Runtime/policy gates:

```text
Phase 1: restricted luna-code viability        PASS
Phase 2: real history://Main retrieval          PASS
Phase 3: persistent same-session continuation   PASS
Phase 4: Notes-backed rollover/recovery         PASS
Policy:  search-first parent retrieval          PASS (correctness/retrieval)
```

Read `docs/VALIDATION.md` for evidence/limits, `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the completed smoke sequence and merge gate, and `docs/HARNESS_V2_TEST_AUTOMATION.md` for the reusable validation-tooling and supervision-audit plan.

## Goal

Maintain a portable personal OMP harness that uses strong models for high-leverage control decisions and inexpensive restricted workers for token-heavy execution, while preserving reproducible configuration, bounded autonomous behavior, measurable context transfer and recoverable installation.

## Source priority

For current behavior, prefer:

1. current `config/`, `agents/`, and `skills/` — executable/runtime policy;
2. `docs/VALIDATION.md` — what has actually been tested;
3. `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` — completed gates and experiment limits;
4. `README.md`, `docs/omp-installation.md`, `docs/omp-configuration.md` — operational use;
5. `docs/HARNESS_V2_GUIDE.md` — architecture rationale.

Earlier chat snippets and historical reports are design evidence, not current instructions. A new OMP session cannot assume that a separate prior session is available through its own `history://Main`.

## Stable implementation surface

- Canonical user-derived config/models using CPA `/v1`, `openai-responses`, and `CPA_API_KEY`.
- Sol control-plane / Luna workforce role mapping.
- Four role-backed restricted workers, including `luna-code` and `luna-deep`.
- `bounded-executor` for scope/repair/stop discipline, now including stagnation/time signals.
- `omp-workflow` delegation, bounded supervision and subagent-context policy.
- Portable copy installer with dry-run, drift detection, backups, rollback, profiles, local overlays and offline doctor.
- Native OMP root/profile handling aligned with current OMP path/profile semantics.
- Notes-backed context enabled in the canonical default configuration, with legacy-context overlay available.

Do not redesign these layers without evidence of a concrete failure.

## Runtime conclusions

### Phase 1 — restricted worker

`luna-code` matched bundled `sonic` at 5/5 independent passes on five bounded fixtures. It showed a narrower enabled tool surface, shorter session-init prompt, fewer observed tool calls/reads, lower aggregate total tokens and lower aggregate wall time. The token reduction was dominated by cache-read tokens, so it is not a direct Business-quota claim. Decision: keep `luna-code` unchanged.

### Phase 2 — Main-history retrieval

A real Main session -> `history://Main` -> one `luna-code` worker path recovered all accepted decisions, excluded superseded/rejected/unresolved material, grounded a repository fact and passed independent scoring. The child used 200,731 total tokens in that long-session smoke. This proved context interpretation, not quota efficiency.

Synthetic parents held open with long `hub wait` were discarded as invalid scaffolding. When downstream work depends on parent history, use a history barrier instead of equating message delivery with durable transcript availability.

### Phase 3 — persistent continuation

One `luna-code` session handled three related tasks across two direct follow-ups. The worker was observed `idle` after each task and the two continuations reported `woken`; no silent respawn/fallback occurred. Task 3 correctly followed a new decision that superseded an earlier behavior. This proves same-session continuation / idle wakeup, not a separately demonstrated `parked -> revived` transition.

### Phase 4 — Notes-backed rollover

Main persisted accepted/superseded/open state into context notes, entered a new context with `new_context`, received the notes-backed state automatically, recovered exact pre-rollover evidence through targeted `history://current/full` lookup, and correctly completed a decision-dependent task. Independent tests and direct behavior checks passed.

Known tooling anomaly: `context_notes` documentation says omitting `text` reads the notebook, while the currently exposed schema requires `text`; an empty string clears the notebook. This was reported through `xd://report_issue`. Automatic notes injection and full-history recovery still worked, so the runtime gate remains satisfied. Avoid empty-string `context_notes` reads.

## Context-policy decision

The workflow separates session delegation context from durable planning:

```text
current task      -> dispatch
implementation    -> repository facts
same-session talk -> history://<parent>
cross-session     -> deliberate .planning/ artifacts
rollover in Main  -> context notes
```

`history://Main` is an automatic concise transcript of the current Main session; Main does not maintain a second history document for workers. For Referenced tasks, workers should search the parent transcript first and read the smallest coherent relevant span. Search-first is a relevance/delegation policy, not a guaranteed token-saving mechanism.

`.planning/` remains the durable project-state mechanism when work must survive a fresh OMP session or deliberate multi-phase workflow. It should materialize accepted/current state, not copy the conversation transcript. Do not create a default `SESSION.md` mirror or mandatory context-capsule subsystem.

See `skills/omp-workflow/references/subagent-context.md` and `skills/omp-workflow/references/context-and-plan.md` for the active policy.

## Search-first policy smoke

One real Main / one `luna-code` worker smoke passed without a rewritten requirements brief or an unbounded `read history://Main`.

Observed retrieval:

- 3 `grep` calls against `history://Main`;
- 5 bounded line-range reads;
- no whole-history read;
- independent scorer: 3/3 accepted, zero superseded/rejected/open pollution, repository fact correct, behavioral pass;
- worker focused test and independent reruns passed;
- child total tokens: 642,661, including 570,880 cache-read tokens;
- wall time: about 1m42s;
- tracked omp-kit tree remained clean.

The important limitation is that the successful bounded ranges collectively covered nearly all of the then-188-line transcript. Therefore the smoke proves direct worker search/retrieval correctness, not strong selectivity or token reduction. The higher observed token total relative to the earlier Phase 2 run is descriptive only because the session/runtime state differed.

Policy refinement: minimize both transcript coverage and retrieval round trips. If relevant matches are dense, prefer one coherent bounded span instead of mechanically tiling most of the transcript. A broader/full concise transcript read remains a fallback when most of a short transcript is genuinely relevant.

## Bounded supervision policy

The prior timeout-heavy synthetic experiment exposed a separate orchestration failure mode: a director can waste substantial wall time merely waiting, while a worker can waste requests repeating a blocker.

The active policy now uses rough first-checkpoint windows (quick/standard/deep), bounded coordination waits, one checkpoint intervention on a material overrun, and escalation/yield/cancellation rather than repeatedly extending the same blocked approach. Workers stop after two materially different failed repairs on one unresolved blocker and also escalate when repeated timeouts or missing capabilities produce no new evidence.

This is policy, not a new fixed global timeout. Do not change `task.softRequestBudget` or add a hard `task.maxRuntimeMs` solely from one slow run. The automation plan now records session spans, request counts and optional parent wait/intervention evidence so future guard tuning can be empirical.

OMP 18.1.18 supports bounded `hub wait` timeouts; `timeoutMs: 0` waits indefinitely. The workflow must not use an indefinite wait merely to supervise a worker.

## Test automation status

A combined deterministic `just verify` recipe has been added. The remaining automation plan is intentionally staged:

1. implement a trustworthy read-only OMP session auditor with session-tree protection, model/fallback trajectory and usage/history/wait metrics;
2. separate worker-visible runtime fixtures from hidden independent oracles;
3. add preparation/finalization helpers that create structured JSON evidence before Markdown reports;
4. optionally audit an explicitly supplied parent session for bounded-supervision evidence.

Live provider/model dispatch remains manual and opt-in. No ordinary test or CI recipe should launch paid/authenticated runtime work.

## Immediate next action

Before final branch review, implement and locally validate the non-provider Stage 1 automation (`inspect_omp_session.py` plus offline parser tests) and verify the new `just verify` recipe. If that batch is clean, either implement Stage 2 immediately or defer it explicitly; do not expand another live context benchmark.

Then perform final branch review for:

- policy consistency across skills/docs/config;
- stale experiment language;
- accidental claims stronger than the evidence;
- installer/config regressions or drift;
- references/registry validity;
- merge readiness of `harness-v2-implementation` against `main`.

## Constraints

- Do not commit keys, `.env`, auth stores, backups, raw session logs or account-specific state.
- Do not grant another machine's setup/QA consent.
- Preserve the canonical CPA transport and model definitions unless measured runtime evidence requires a change.
- Do not claim a custom agent has a minimal provider-facing system prompt; current OMP still constructs a substantial child harness.
- Tool restriction reduces action-space complexity but is not security isolation.
- Do not infer ChatGPT Business quota from configured API-equivalent prices or raw token totals.
- Worker self-report is not verification; use independent acceptance checks where failure matters.

## Merge direction

The installer/config gate, bounded runtime gates and search-first policy smoke are satisfied. Multi-hour endurance/quota work is deferred and should not block merge.

Before merging `harness-v2-implementation` to `main`:

1. validate the small offline automation batch and bounded-supervision policy text;
2. perform final branch review;
3. fix only concrete inconsistencies/defects found by that review;
4. merge only if no new high-severity defect is found.

## Deferred until evidence requires them

No OMP fork, custom scheduler, raw cross-agent full-history API, automated context curator, pricing service, replacement minimal system prompt, complex experiment framework, automatic cancellation solely by elapsed time, or mandatory decision-capsule subsystem. Add one only when an observed failure or repeated manual cost justifies it.
