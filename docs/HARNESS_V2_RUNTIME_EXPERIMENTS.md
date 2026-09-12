# Harness v2 runtime experiment plan

## Purpose

Installer/config portability is locally validated on the current Linux/WSL2 machine. The bounded runtime architecture gates are now also complete: restricted `luna-code` viability, one real `history://Main` pull without decision pollution, same-session persistent continuation, and Notes-backed rollover/recovery have all passed.

Do not continue expanding synthetic smoke tests without a concrete unresolved architectural question. Multi-hour endurance/quota measurement can continue later during real work and is not a merge blocker.

## Experiment policy

- Use a native OMP profile so custom agents are definitely discoverable.
- Keep model routing fixed during one experiment.
- Verify which child agent actually ran; a silent fallback invalidates the run.
- Verify behavior independently from worker self-report.
- Use the smallest experiment that answers the architectural question.
- Do not treat configured API-equivalent cost or total tokens as direct ChatGPT Business quota accounting.
- Keep raw experiment output outside tracked docs until reviewed; commit durable conclusions, not every transient log.

## Phase 1 — Luna worker harness A/B — COMPLETE

Question: does a restricted custom Luna worker remain correct while reducing unnecessary context/tool activity versus bundled `sonic`?

Five deterministic Python fixtures were run in alternating A/B order inside the same native profile. Both requested agents were confirmed from child `session_init` records; all ten children resolved to `cpa/gpt-5.6-luna:high`.

Result:

- correctness: `sonic` 5/5, `luna-code` 5/5;
- provider requests: 35 per arm;
- total tokens: 634,708 vs 454,638 (**28.4% lower** for `luna-code`);
- aggregate wall time: 273.2 s vs 240.6 s (**11.9% lower**);
- effective enabled tools: 16 vs 10;
- mean session-init system prompt: 26,808.8 vs 17,245 characters;
- observed tool calls: 54 vs 44;
- `read` calls: 31 vs 19;
- failed tool calls: 0 in both arms.

The token reduction was mainly cache-read reduction; uncached/input tokens were nearly equal. Keep `luna-code` unchanged. This is not proof of proportional Business-quota savings or a minimal provider-facing prompt.

## Phase 2 — Real parent-context pull — COMPLETE

Question: can `luna-code` recover current accepted requirements from a real `history://Main` transcript while excluding superseded, rejected and unresolved discussion, without receiving a rewritten full requirements brief?

The valid smoke used the actual Main session:

```text
real Main session
-> verify history://Main
-> one luna-code worker
-> independent scorer
```

The worker received only the objective, temporary fixture path and `history://Main`.

Independent scoring:

```text
accepted_correct: 3/3
superseded_incorrect: 0
rejected_tentative_incorrect: 0
unresolved_incorrect: 0
repository_facts_correct: 1/1
behavioral_pass: true
```

Observed child evidence included one history read, about 85 s wall time and 200,731 total child tokens. This satisfies the one-shot parent-history gate but also shows that reading a long Main transcript can be context-heavy.

The earlier synthetic-parent approach was discarded: long `hub wait` intervals measured lifecycle waiting and delivered steering was not treated as proof of durable transcript state.

## Phase 3 — Persistent same-session continuation — COMPLETE

Question: can one `luna-code` worker own a coherent workstream across several related follow-ups without silent respawn or stale-context failure?

One worker/session completed three related tasks. After Task 1 and Task 2 it was observed `idle`; direct follow-ups for Tasks 2 and 3 reported `woken`. The same session handled all three stages. Task 2 reused the Task 1 helper, and Task 3 correctly applied a new decision superseding the old separator behavior. Independent verification passed.

Observed evidence:

- one `luna-code` session for all three tasks;
- Luna High, no fallback;
- two `idle -> woken` continuations;
- no extra worker or unbounded `hub wait`;
- final 3 tests passed;
- total child tokens: 255,433;
- end-to-end session wall time: about 3m24s.

This proves same-session persistence and wake continuation. It does **not** separately prove a true `parked -> revived` transition, which is not required by the current merge gate.

## Phase 4 — Notes-backed main context — COMPLETE

Question: can Main preserve decisions across a context rollover and recover exact old evidence without relying only on lossy summaries?

One rollover/recovery smoke passed:

1. Main formed an explicit decision for `render_notice(label)` including accepted, superseded and unresolved state.
2. The decision/recovery information was written to context notes.
3. `new_context` entered a new context window.
4. The new window automatically received the notes-backed context and recovered accepted/superseded/open state.
5. A targeted search of `history://current/full` found marker `PHASE4-EVIDENCE-7C91-NOTICE-PIPE` at line 30138; reading lines 30131-30138 recovered the exact pre-rollover decision text.
6. The decision-dependent implementation and independent verification passed.

### Known tooling anomaly

`context_notes` documentation says omitting `text` reads the notebook, but the currently exposed schema requires `text`. Passing an empty string clears the notebook. This mismatch was submitted through `xd://report_issue`; the notebook was restored afterward.

The anomaly does not invalidate the Phase 4 gate because automatic notes injection after rollover and exact full-history recovery both worked. Treat empty-string `context_notes` as destructive and avoid it as a read operation until the runtime/tooling issue is fixed.

## Runtime gate status

```text
Phase 1  restricted luna-code viability        PASS
Phase 2  real history://Main retrieval          PASS
Phase 3  persistent same-session continuation   PASS
Phase 4  Notes-backed rollover/recovery         PASS
```

## Phase 5 — Real-work endurance — DEFERRED

Measure multi-hour real work only when useful operational data accumulates. Track active wall time before account-limit/recovery events, completed accepted workstreams, Luna/Sol request and token share, cache-read rate, retries/escalations, worker reuse, human interventions and escaped review findings.

Do not infer Business quota directly from configured API-equivalent prices or raw token totals.

## Merge gate for Harness v2

The bounded runtime gate is satisfied when:

1. installer/config regression suite remains green;
2. native-profile custom workers are confirmed in live OMP;
3. Phase 1 custom-worker viability is satisfied;
4. Phase 2 one-shot real parent-history pull succeeds without decision pollution;
5. Phase 3 same-session persistent continuation succeeds without fallback/context loss;
6. Phase 4 Notes-backed rollover/recovery succeeds or Notes-backed context is deliberately disabled;
7. no unresolved high-severity runtime defect remains.

All seven conditions are currently satisfied on the validated Linux/WSL2 + OMP 18.1.18 path. The `context_notes` schema/documentation mismatch is a known non-blocking runtime tooling defect, not a failure of the rollover/recovery path.

Before merging to `main`, settle the remaining context-policy simplification and perform a final branch review. Endurance/quota optimization can continue after merge.

## Next design question — Main-session context policy

Do not add a parallel context subsystem by default. The next design work should simplify how workers consume Main context, especially replacing default whole-history reads with targeted search/grep and local reads where possible. Durable `.planning/` artifacts should remain a deliberately chosen long-lived project workflow rather than a mandatory mirror of session history.

## Change discipline

Freeze the installer transaction/recovery architecture, native-root/profile selection rules, CPA transport/auth, role-to-model mapping, custom worker tools, bounded-executor policy and Notes-backed default unless a concrete failure implicates one of those layers.
