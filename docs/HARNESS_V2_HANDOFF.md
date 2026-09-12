# Harness v2 implementation handoff

## Current state

Harness v2 is in runtime validation rather than installer design. Installation/config/profile behavior is locally validated on Linux/WSL2. Runtime Phase 1 established that the restricted custom `luna-code` worker is operationally viable against bundled `sonic` on a bounded five-task sample. Runtime Phase 2 has now produced one successful real `history://Main` context-pull smoke without decision pollution.

Installer/config validation baseline:

```text
installer tests: 50 passed
root tests:      88 passed
validate-harness: passed
check-registry:   passed
validate-registry: passed
git diff --check: passed
```

Runtime gates satisfied so far:

```text
Phase 1: luna-code viability             satisfied
Phase 2: one real history://Main pull    satisfied
```

Read `docs/VALIDATION.md` for evidence and limits, and `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the active experiment sequence.

## Goal

Maintain a portable personal OMP harness that uses strong models for high-leverage control decisions and inexpensive restricted workers for token-heavy execution, while preserving reproducible configuration, bounded autonomous behavior, measurable context transfer, and recoverable installation.

## Source priority

For current behavior, prefer:

1. `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` — active runtime questions and protocol;
2. `docs/VALIDATION.md` — what has actually been tested;
3. `README.md`, `docs/omp-installation.md`, `docs/omp-configuration.md` — operational use;
4. `docs/HARNESS_V2_GUIDE.md` — architecture rationale;
5. current `config/`, `agents/`, and `skills/` — executable/runtime policy.

Earlier chat snippets and historical reports are design evidence, not current instructions. A new OMP session cannot retrieve the separate ChatGPT design conversation through its own `history://Main`.

## Stable implementation surface

- Canonical user-derived config/models using CPA `/v1`, `openai-responses`, and `CPA_API_KEY`.
- Sol control-plane / Luna workforce role mapping.
- Four role-backed restricted workers, including `luna-code` and `luna-deep`.
- `bounded-executor` for scope/repair/stop discipline.
- `omp-workflow` delegation and subagent-context policy.
- Portable copy installer with dry-run, drift detection, backups, rollback, profiles, local overlays, and offline doctor.
- Native OMP root/profile handling aligned with current OMP path/profile semantics.
- Notes-backed context enabled in the canonical default configuration, with legacy-context overlay available.

Do not redesign these layers while running experiments unless a concrete failure implicates them.

## Phase 1 conclusion

The same native profile, model role, effort, fixtures, and independent verification were used for bundled `sonic` and custom `luna-code`.

`luna-code` matched `sonic` at 5/5 independent passes. The two arms made the same aggregate number of provider requests (35 each). `luna-code` showed a narrower enabled tool surface (10 vs 16), a shorter session-init system prompt (17,245 vs 26,808.8 mean characters), fewer observed tool calls (44 vs 54), fewer reads (19 vs 31), lower aggregate total tokens (454,638 vs 634,708), and lower aggregate wall time (240.6 s vs 273.2 s).

The token reduction was dominated by cache-read tokens; uncached/input tokens were nearly equal. Do not convert the 28.4% total-token reduction into a Business quota claim. Both arms still receive a substantial OMP child base harness, so this does not establish a truly minimal provider-facing prompt.

Decision: keep `luna-code` unchanged.

## Phase 2 conclusion

A synthetic-parent benchmark setup was discarded because long `hub wait` intervals measured lifecycle waiting and did not cleanly guarantee that every intended steering turn had become durable history.

The valid smoke used the real Main session. A preflight/history barrier verified `history://Main`, the presence of accepted/superseded/rejected/unresolved discussion, the actual `luna-code` identity, Luna High, and no fallback. The worker then received only the objective, temporary fixture path, and `history://Main`.

Independent scoring returned:

```text
accepted_correct: 3/3
superseded_incorrect: 0
rejected_tentative_incorrect: 0
unresolved_incorrect: 0
repository_facts_correct: 1/1
behavioral_pass: true
```

This satisfies the merge gate requiring one parent-history pull without decision pollution. It does not prove repeated reliability or quota efficiency. The observed 200,731 child tokens also show that pulling a long Main transcript can be context-heavy; a compact decision capsule/view is a future optimization only if repeated real work makes that cost material.

For lifecycle-sensitive work, prefer complete-turn -> park/yield -> direct-message revival over unbounded `hub wait`. When downstream work depends on parent history, use a history barrier rather than equating message delivery with durable transcript availability.

## Immediate next phase

Run **Phase 3: persistent worker continuation smoke**.

Use one `luna-code` worker for one coherent subsystem and three related steps:

```text
spawn once
-> task 1
-> park/yield
-> direct follow-up / revive
-> task 2
-> park/yield
-> direct follow-up / revive
-> task 3
```

Do not run a full fresh-vs-reused benchmark yet. The smoke gate only needs to establish:

- same worker/session continuation rather than silent respawn;
- correct independent result after each follow-up;
- useful retained subsystem context;
- no stale-context error when a material parent decision changes;
- successful park/revive behavior without unbounded waiting.

After Phase 3:

4. one Notes-backed rollover/recovery smoke test;
5. endurance/quota measurement after the behavior above is trustworthy.

## Constraints

- Do not commit keys, `.env`, auth stores, backups, raw session logs, or account-specific state.
- Do not grant another machine's setup/QA consent.
- Preserve the canonical imported CPA transport and model definitions unless measured runtime evidence requires a change.
- Keep `luna-code` unchanged during the next smoke so worker lifecycle is the intentional variable.
- Do not claim a custom agent has a minimal provider-facing system prompt; current OMP still constructs a substantial child harness.
- Tool restriction reduces action-space complexity but is not security isolation.
- Do not infer ChatGPT Business quota from configured API-equivalent prices or total-token counts.
- Worker self-report is not verification; use independent acceptance checks.
- Do not build synthetic parent/session machinery when the real runtime topology can answer the question more directly.

## Merge direction

Do not keep the implementation branch open indefinitely for perfect quota data. Phase 1 custom-worker viability and Phase 2 one-shot parent-history pull are satisfied. Merge to `main` once persistent continuation works at least once, Notes-backed context is smoke-tested or deliberately disabled pending testing, and no high-severity runtime defect remains.

Longer endurance/quota optimization can continue after merge.

## Deferred until evidence requires them

No OMP fork, custom scheduler, raw cross-agent full-history API, automated context curator, pricing service, replacement minimal system prompt, complex experiment framework, or mandatory decision-capsule subsystem. Add one only when an observed failure or repeated manual cost justifies it.
