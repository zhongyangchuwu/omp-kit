# Harness v2 runtime experiment plan

## Purpose

Installer/config portability is locally validated on the current Linux/WSL2 machine. Runtime Phase 1 has also established that the restricted custom `luna-code` worker is operationally viable against bundled `sonic` on five bounded coding fixtures. The next phase should continue testing the runtime hypotheses that motivated Harness v2 rather than returning to installer work without a concrete defect.

The order below is deliberate: worker-harness effects first, then context transfer, then persistence, then long-context management, and only then endurance/quota behavior. Do not tune multiple layers at once or conclusions will be hard to attribute.

## Experiment policy

- Use a native OMP profile so custom agents are definitely discoverable.
- Keep model routing fixed during one experiment. Record the exact commit, OMP version, profile, and role mapping.
- Alternate comparison arms to reduce cache/order bias.
- Verify which child agent actually ran; a silent fallback invalidates the run.
- Verify behavior independently from the worker's self-report.
- Record provider requests, input/cache/output/reasoning tokens, wall time, tool calls, retries/repairs, human intervention, and final correctness when available.
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

Keep `luna-code` unchanged for the next phase. Do not change its tool list, bounded-executor policy, or effort based on this sample alone.

## Phase 2 — Parent-context pull A/B — NEXT

### Question

Can a worker reliably recover accepted decisions from `history://<parent-agent-id>` without the director rewriting the whole conversation into the dispatch?

### Arms

```text
A: explicit long brief containing all accepted requirements
B: short intent + scope + parent-history URI
```

Use the same `luna-code` worker, model, repository fixture, and acceptance checks in both arms.

### Required parent discussion shape

Construct one controlled parent conversation containing:

- several explicit accepted decisions;
- at least one earlier decision explicitly superseded later;
- at least two rejected or tentative alternatives;
- at least one unresolved/open question that must not become a requirement;
- repository facts that are independently readable from the fixture rather than restated by the parent.

The final worker result must be scored for both inclusion and exclusion:

- accepted current decisions must appear in the implementation/documentation;
- superseded decisions must not survive;
- rejected/tentative options must not be promoted to requirements;
- unresolved questions must remain unresolved unless the task contract itself resolves them;
- repository facts should come from repository inspection, not from invented transcript content.

### Protocol

Run at least five paired repetitions using freshly constructed but structurally equivalent parent discussions. Alternate arm order where practical. Keep worker/model/effort/tool list fixed.

For each run record:

```text
run id
arm / actual child agent
parent agent id / history URI used
model + effort
accepted decisions recovered correctly
superseded decisions excluded
rejected/tentative ideas excluded
open question left unresolved
independent verification result
provider request count
parent input/output/cache/reasoning tokens
worker input/output/cache/reasoning tokens
total parent + worker tokens
wall-clock time
worker history reads / targeted rereads
parent steering/intervention
unexpected behavior
```

The main metric is not worker-token reduction alone. Compare **total director + worker cost/activity** because the point of history pull is to avoid expensive director restatement while retaining interpretation quality.

### Gate

Keep the Referenced context policy only if repeated runs show that the worker can distinguish accepted, superseded, tentative, rejected, and unresolved material without material correctness loss.

If exact wording matters, require targeted retrieval of the original passage rather than trusting a compacted summary. If `history://<parent-agent-id>` is unavailable or resolves to the wrong agent, stop and classify it as a routing/runtime failure rather than substituting another context source silently.

## Phase 3 — Persistent worker reuse

### Question

Does reusing one persistent worker for a coherent workstream reduce rediscovery and total cost without causing stale-context errors?

Compare:

```text
A: spawn a fresh luna-code worker for each of three related follow-ups
B: spawn once, then continue the same worker through hub messages
```

The three tasks should build on the same subsystem and require shared repository understanding. Record repeated read/grep activity, tokens, time, repair count, and correctness.

A useful persistent worker should need less rediscovery while still noticing new parent decisions. Re-read parent history only when a material decision changed.

After the basic reuse test, separately test park/revive behavior. Do not combine park/revive with the first reuse comparison.

## Phase 4 — Notes-backed main context

### Question

Can the Sol main session maintain decisions and recover old evidence across a context rollover without repeated lossy summary chains?

Test the existing notes-backed setting before redesigning it. The smoke test should verify:

- `context_notes` is present and can preserve accepted decisions/invariants;
- a new context window can be entered safely;
- older exact material remains recoverable through `history://current/full` in the same session;
- a worker still uses concise parent history rather than assuming access to the main session's private full archive;
- an explicit decision made before rollover is still applied correctly after rollover.

Do not compare quota/endurance until this behavior is trustworthy. If notes become noisy, stale, or overwrite important decisions, collect concrete failures before introducing a context-curator agent.

## Phase 5 — Real-work endurance

Only after Phases 2–4 are stable, run normal project work for multi-hour windows and measure the actual objective: useful completed work per human hour and per Business quota window.

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
4. one parent-history pull task succeeds without turning rejected/open discussion into requirements;
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
missing capability/tool
worker execution/repair loop
verification gap
model capability/effort
provider/runtime failure
```

Change only the layer implicated by evidence.
