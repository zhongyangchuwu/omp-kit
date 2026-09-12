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

Read `docs/VALIDATION.md` for evidence/limits and `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the completed smoke sequence and merge gate.

## Goal

Maintain a portable personal OMP harness that uses strong models for high-leverage control decisions and inexpensive restricted workers for token-heavy execution, while preserving reproducible configuration, bounded autonomous behavior, measurable context transfer and recoverable installation.

## Source priority

For current behavior, prefer:

1. `docs/VALIDATION.md` — what has actually been tested;
2. `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` — completed runtime gates and remaining limits;
3. `README.md`, `docs/omp-installation.md`, `docs/omp-configuration.md` — operational use;
4. `docs/HARNESS_V2_GUIDE.md` — architecture rationale;
5. current `config/`, `agents/`, and `skills/` — executable/runtime policy.

Earlier chat snippets and historical reports are design evidence, not current instructions. A new OMP session cannot retrieve a separate ChatGPT design conversation through its own `history://Main`.

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

## Immediate design work

Stop expanding runtime smoke tests. The next task is to simplify Main-session context policy before final branch review.

The leading direction is:

- local tasks should not read Main history;
- context-dependent workers should search/grep `history://Main` first and read only relevant passages rather than defaulting to a full-history read;
- high-risk/ambiguous work may receive an explicit short contract;
- do not introduce a parallel mandatory context-capsule system unless real usage justifies it;
- durable `.planning/` artifacts remain an explicitly chosen long-lived workflow, not an automatic mirror of session history.

The exact boundary between searchable session history and durable `.planning/` state is still under design and should be settled before merge.

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

1. settle the simplified Main-session context policy;
2. update the relevant workflow references without creating a redundant context subsystem;
3. perform one final branch review;
4. merge only if no new high-severity defect is found.

## Deferred until evidence requires them

No OMP fork, custom scheduler, raw cross-agent full-history API, automated context curator, pricing service, replacement minimal system prompt, complex experiment framework or mandatory decision-capsule subsystem. Add one only when an observed failure or repeated manual cost justifies it.
