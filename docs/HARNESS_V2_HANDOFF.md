# Harness v2 implementation handoff

## Current state

Harness v2 is no longer primarily an installer-design project. The current implementation branch has locally validated installation/config/profile behavior on Linux/WSL2 and has already completed one live CPA/Luna path plus native-profile custom-agent execution.

Validated head at the start of the runtime-experiment phase:

```text
branch: harness-v2-implementation
head:   a99dd42b
```

Current local regression evidence at that head:

```text
installer tests: 50 passed
root tests:      88 passed
validate-harness: passed
check-registry:   passed
validate-registry: passed
git diff --check: passed
```

Read `docs/VALIDATION.md` for evidence and limits, and `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the next phase.

## Goal

Maintain a portable personal OMP harness that uses strong models for high-leverage control decisions and inexpensive restricted workers for token-heavy execution, while preserving reproducible configuration, bounded autonomous behavior, measurable context transfer, and recoverable installation.

## Source priority

For current behavior, prefer:

1. `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` — next runtime questions and experiment protocol;
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

## Immediate next phase

Run experiments in this order:

1. **Worker harness A/B** — bundled `sonic` vs custom `luna-code`, both resolving to Luna High inside the same native profile.
2. **Context transfer A/B** — explicit long brief vs short intent + parent-history retrieval.
3. **Persistent worker reuse** — fresh worker per follow-up vs one reused worker through hub continuation.
4. **Notes-backed context smoke/rollover** — preserve accepted decisions and recover old exact evidence.
5. **Endurance/quota measurement** — only after runtime behavior is stable.

The purpose is to identify which layer actually changes correctness, human intervention, tool behavior, and quota consumption. Do not tune model effort, worker prompt, tool list, context strategy, and compaction simultaneously.

## Constraints

- Do not commit keys, `.env`, auth stores, backups, session logs, or account-specific state.
- Do not grant another machine's setup/QA consent.
- Preserve the canonical imported CPA transport and model definitions unless measured runtime evidence requires a change.
- Do not claim a custom agent has a minimal provider-facing system prompt; current OMP still constructs a substantial child harness.
- Tool restriction reduces action-space complexity but is not security isolation.
- Do not infer ChatGPT Business quota from configured API-equivalent prices.
- A run is invalid for comparison if the requested child agent silently falls back to another agent.
- Worker self-report is not verification; use an independent acceptance check.

## Merge direction

Do not keep the implementation branch open indefinitely for perfect quota data. Merge to `main` once the runtime merge gate in `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` is satisfied: custom workers viable, parent-history retrieval proven once, persistent continuation proven once, Notes-backed context smoke-tested or deliberately disabled, and no high-severity runtime defect remains.

Longer endurance/quota optimization can continue after merge.

## Deferred until evidence requires them

No OMP fork, custom scheduler, raw cross-agent full-history API, automated context curator, pricing service, replacement minimal system prompt, or complex experiment framework. Add one only when an observed failure or repeated manual cost justifies it.
