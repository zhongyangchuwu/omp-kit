# Harness v2 implementation handoff

## Current state

Harness v2 is now in runtime validation rather than installer design. Installation/config/profile behavior is locally validated on Linux/WSL2, and Runtime Phase 1 has established that the restricted custom `luna-code` worker is operationally viable against bundled `sonic` on a bounded five-task sample.

Installer/config validation baseline:

```text
installer tests: 50 passed
root tests:      88 passed
validate-harness: passed
check-registry:   passed
validate-registry: passed
git diff --check: passed
```

Runtime Phase 1 baseline:

```text
native profile: harness-v2-test
parent:         cpa/gpt-5.6-sol:medium
both arms:      cpa/gpt-5.6-luna:high
sonic:          5/5 independent passes
luna-code:      5/5 independent passes
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

Decision: keep `luna-code` unchanged and continue the runtime sequence.

## Immediate next phase

Run **Phase 2: Context transfer A/B**.

Compare:

```text
A: explicit long brief containing all accepted requirements
B: short intent + scope + history://<parent-agent-id>
```

Keep `luna-code`, Luna High, tool list, parent model, repository fixture class, and acceptance scoring fixed.

The parent discussion must contain accepted current decisions, one superseded earlier decision, rejected/tentative alternatives, and at least one unresolved question. Score both inclusion and exclusion. A worker that implements a rejected or unresolved idea fails the interpretation criterion even if tests pass.

Measure total parent + worker activity rather than worker tokens alone. The purpose is to test whether parent-history pull avoids expensive restatement without degrading requirement interpretation.

After Phase 2:

3. persistent worker reuse — fresh workers vs one continued worker;
4. Notes-backed rollover/recovery smoke test;
5. endurance/quota measurement after the behavior above is trustworthy.

## Constraints

- Do not commit keys, `.env`, auth stores, backups, raw session logs, or account-specific state.
- Do not grant another machine's setup/QA consent.
- Preserve the canonical imported CPA transport and model definitions unless measured runtime evidence requires a change.
- Keep `luna-code` unchanged during Phase 2 so context transfer is the only intentional variable.
- Do not claim a custom agent has a minimal provider-facing system prompt; current OMP still constructs a substantial child harness.
- Tool restriction reduces action-space complexity but is not security isolation.
- Do not infer ChatGPT Business quota from configured API-equivalent prices or total-token counts.
- A run is invalid for comparison if the requested child agent silently falls back to another agent or the requested history URI is unavailable and silently replaced by another context source.
- Worker self-report is not verification; score outputs independently against the controlled decision set and repository facts.

## Merge direction

Do not keep the implementation branch open indefinitely for perfect quota data. Phase 1 custom-worker viability is now satisfied. Merge to `main` once a parent-history pull task succeeds without decision pollution, persistent continuation works at least once, Notes-backed context is smoke-tested or deliberately disabled pending testing, and no high-severity runtime defect remains.

Longer endurance/quota optimization can continue after merge.

## Deferred until evidence requires them

No OMP fork, custom scheduler, raw cross-agent full-history API, automated context curator, pricing service, replacement minimal system prompt, or complex experiment framework. Add one only when an observed failure or repeated manual cost justifies it.
