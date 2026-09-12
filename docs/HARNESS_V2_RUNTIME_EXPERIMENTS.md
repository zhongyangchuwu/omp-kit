# Harness v2 runtime experiment plan

## Purpose

Installer/config portability is locally validated on the current Linux/WSL2 machine. Runtime Phase 1 established that the restricted custom `luna-code` worker is operationally viable against bundled `sonic` on five bounded coding fixtures. Runtime Phase 2 has now established one successful real `history://Main` context-pull path without decision pollution.

The remaining order is deliberate: persistent worker lifecycle first, then long-context management, and only then endurance/quota behavior. Do not tune multiple layers at once or conclusions will be hard to attribute.

## Experiment policy

- Use a native OMP profile so custom agents are definitely discoverable.
- Keep model routing fixed during one experiment. Record the exact commit, OMP version, profile, and role mapping.
- Verify which child agent actually ran; a silent fallback invalidates the run.
- Verify behavior independently from the worker's self-report.
- Use the smallest experiment that answers the architectural question; do not build a benchmark framework when a smoke test is sufficient.
- Do not treat configured API-equivalent cost or total tokens as direct ChatGPT Business quota accounting.
- Keep raw experiment output outside tracked docs until reviewed; commit durable conclusions, not every transient log.

## Phase 1 — Luna worker harness A/B — COMPLETE

### Question

Does a restricted custom Luna worker complete scoped coding tasks at least as reliably as the bundled worker while reducing unnecessary context/tool activity?

### Arms

```text
A: bundled sonic -> @fast_worker -> Luna High
B: custom luna-code -> @fast_worker -> Luna High
```

### Completed protocol

Five deterministic Python fixtures were run in alternating A/B order inside the same native profile, with pristine copies and independent focused verification after each child completed. Both requested agents were confirmed from child `session_init` records; all ten children resolved to `cpa/gpt-5.6-luna:high`.

### Result

- correctness: `sonic` 5/5, `luna-code` 5/5;
- provider requests: 35 per arm;
- total tokens: 634,708 vs 454,638 (**28.4% lower** for `luna-code`);
- aggregate wall time: 273.2 s vs 240.6 s (**11.9% lower**);
- effective enabled tools: 16 vs 10;
- mean session-init system prompt: 26,808.8 vs 17,245 characters;
- observed tool calls: 54 vs 44;
- `read` calls: 31 vs 19;
- failed tool calls: 0 in both arms.

The total-token reduction was mainly cache-read reduction (482,816 vs 302,080); uncached/input tokens were nearly equal (144,582 vs 145,424). The experiment therefore supports a narrower and descriptively leaner worker harness, but does not prove proportional Business quota savings or a minimal provider-facing prompt.

### Decision

Keep `luna-code` unchanged. Do not change its tool list, bounded-executor policy, or effort based on this sample alone.

## Phase 2 — Real parent-context pull — COMPLETE AS A SMOKE GATE

### Question

Can `luna-code` recover current accepted requirements from a real `history://Main` transcript while excluding superseded, rejected, and unresolved discussion, without receiving a rewritten full requirements brief?

### Setup correction discovered before the valid run

An earlier synthetic-parent setup was invalid for this question. Long `hub wait` periods measured lifecycle waiting rather than model inference, and delivered steering messages were not a sufficient guarantee that every intended turn had reached durable history. Synthetic-parent lifecycle therefore polluted the variable under test.

The valid smoke test instead used the actual Main session:

```text
real Main session
-> verify history://Main
-> one luna-code worker
-> independent scorer
```

A history barrier was applied before dispatch: `history://Main` had to exist, resolve to the intended parent, and visibly contain accepted, superseded, rejected, and unresolved material. The child identity/model also had to be verified without fallback.

### Result

The worker received only the objective, temporary fixture path, and `history://Main`; it did not receive a rewritten final requirements brief.

Observed child evidence:

- actual agent: `luna-code`;
- model: `cpa/gpt-5.6-luna`;
- thinking level: `high`;
- `resolvedModelIsFallback: false`;
- `history://Main` reads: 1;
- wall time: about 85 s;
- total child tokens: 200,731;
- edits were confined to the temporary fixture; tracked omp-kit files were unchanged.

Independent scoring:

```text
accepted_correct: 3/3
superseded_incorrect: 0
rejected_tentative_incorrect: 0
unresolved_incorrect: 0
repository_facts_correct: 1/1
behavioral_pass: true
```

The worker correctly recovered key-based cache reuse, caching of `None`, and no expiration. It did not retain the superseded truthy-only behavior, add the rejected LRU/capacity idea, or invent locking/concurrency policy for the unresolved thread-safety question. Its own focused tests also passed.

### Interpretation

This satisfies the current merge gate for **one demonstrated parent-history pull without decision pollution**. It does not establish repeated-run reliability, quota savings, or broad interpretation robustness.

The 200k child-token observation is a useful warning rather than a failure: reading a long real Main transcript can be context-heavy even when semantically correct. Do not optimize this yet. If repeated real work shows history reconstruction is a material quota/latency cost, consider a compact materialized decision view/capsule where accepted state is explicit and `history://Main` remains available for rationale/evidence.

### Current policy

Keep three context modes:

- **Direct:** precise local task; no history pull.
- **Referenced:** objective/scope plus a verified parent history URI; worker reconstructs current decisions.
- **Explicit contract:** high-risk task receives a short accepted-decision capsule; history supplements rationale and evidence rather than acting as the sole specification.

Do not use unbounded `hub wait` as a way to keep a parent alive. Persistent agents should complete a turn, park/yield, and be revived by a later direct message when more work arrives.

## Phase 3 — Persistent worker reuse — NEXT

### Question

Can one `luna-code` worker own a coherent workstream across several related follow-ups without losing context or requiring repeated repository rediscovery?

### Minimal smoke protocol

Do not run a full A/B benchmark yet. Use one worker and one subsystem:

```text
spawn luna-code once
-> task 1
-> park/yield
-> direct follow-up message / revive
-> task 2
-> park/yield
-> direct follow-up message / revive
-> task 3
```

The three tasks should build on the same subsystem and require some shared repository understanding. Verify:

- the same worker/session is actually continued rather than silently respawned;
- each follow-up is independently correct;
- the worker retains useful subsystem context;
- a new parent decision, if introduced between tasks, is noticed rather than overridden by stale worker context;
- no unbounded `hub wait` is used to preserve liveness;
- direct messaging can revive the parked worker as expected.

Record only what is readily available: worker identity/session continuity, correctness, obvious repeated read/grep activity, total tokens/time if easy to extract, and any stale-context or lifecycle failure. One clean three-step continuation is enough for the merge gate.

If continuation fails, classify the failure before changing the harness: lifecycle/revival, routing, stale context, capability/tool, or model behavior.

## Phase 4 — Notes-backed main context

### Question

Can the Sol main session maintain decisions and recover old evidence across a context rollover without repeated lossy summary chains?

Use one rollover/recovery smoke test, not a benchmark. Verify:

- `context_notes` is present and can preserve accepted decisions/invariants;
- a new context window can be entered safely;
- older exact material remains recoverable through `history://current/full` in the same session;
- a worker still uses concise parent history rather than assuming access to the main session's private full archive;
- an explicit decision made before rollover is still applied correctly after rollover.

If notes become noisy, stale, or overwrite important decisions, collect the concrete failure before introducing a context-curator agent.

## Phase 5 — Real-work endurance

Only after Phases 3–4 are stable, run normal project work for multi-hour windows and measure the actual objective: useful completed work per human hour and per Business quota window.

Track at least:

- active wall time before account limit/recovery events;
- completed accepted workstreams;
- Luna/Sol request and token share;
- cache-read rate;
- retries/escalations;
- worker reuse rate;
- human interventions;
- review findings that escaped worker verification.

Do not infer Business quota directly from configured API-equivalent prices.

## Merge gate for Harness v2

The implementation branch is ready to merge to `main` when:

1. installer/config regression suite remains green;
2. native-profile custom workers are confirmed in live OMP;
3. **Phase 1 custom-worker viability is satisfied** (`luna-code` matched bundled `sonic` 5/5 on the bounded fixture sample without fallback);
4. **Phase 2 parent-history smoke is satisfied** (one real `history://Main` pull recovered accepted decisions without promoting superseded/rejected/open material);
5. persistent worker continuation works at least once without fallback or context loss;
6. notes-backed context receives a basic rollover/recovery smoke test, or is explicitly disabled in the default profile pending that test;
7. no unresolved high-severity runtime defect remains.

Endurance optimization can continue after merge; it should not block forever once the architecture is safe and measurable.

## Change discipline during experiments

Freeze the following unless an experiment reveals a concrete failure:

- installer transaction/recovery architecture;
- native-root/profile selection rules;
- canonical CPA endpoint/auth variable;
- current role-to-model mapping;
- custom worker tool lists;
- bounded-executor policy;
- Notes-backed default setting.

When a run fails, classify the failure before editing anything:

```text
routing/discovery
context interpretation
lifecycle/revival
stale worker context
missing capability/tool
worker execution/repair loop
verification gap
model capability/effort
provider/runtime failure
```

Change only the layer implicated by evidence.
