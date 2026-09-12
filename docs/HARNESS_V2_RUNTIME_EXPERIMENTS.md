# Harness v2 runtime experiment plan

## Purpose

Installer/config portability is now locally validated on the current Linux/WSL2 machine. The next phase should stop changing installation machinery unless a real defect appears and instead test the runtime hypotheses that motivated Harness v2.

The order below is deliberate: first isolate worker-harness effects, then context transfer, then persistence, then long-context management, and only then measure endurance/quota behavior. Do not tune multiple layers at once or conclusions will be hard to attribute.

## Experiment policy

- Use a native OMP profile so custom agents are definitely discoverable.
- Keep model routing fixed during one experiment. Record the exact commit, OMP version, profile, and role mapping.
- Alternate comparison arms to reduce cache/order bias.
- Verify which child agent actually ran; a silent fallback invalidates the run.
- Verify behavior independently from the worker's self-report.
- Record provider requests, input/cache/output/reasoning tokens, wall time, tool calls, retries/repairs, human intervention, and final correctness when available.
- Do not treat configured API-equivalent cost as ChatGPT Business quota accounting.
- Keep raw experiment output outside tracked docs until reviewed; commit durable conclusions, not every transient log.

## Phase 1 — Luna worker harness A/B

### Question

Does a restricted custom Luna worker complete scoped coding tasks at least as reliably as the bundled worker while reducing unnecessary context/tool activity?

### Arms

Use the same native Harness v2 profile and the same model role for both arms:

```text
A: bundled sonic -> @fast_worker -> Luna High
B: custom luna-code -> @fast_worker -> Luna High
```

This is intentionally not a default-root-vs-profile comparison. Both arms must run inside the same installed profile so configuration, provider, model, and parent environment are held constant. The main variable should be the worker contract/tool surface.

### Protocol

Run at least 5 alternating repetitions per arm. Prefer several independently verifiable tasks rather than one trivial task repeated ten times. Each task should have a fresh checkout/copy and a focused test command known before the worker starts.

For each run capture:

```text
run id
arm / actual child agent id
model + effort
success / independent verification
provider request count
input tokens
cache-read tokens
output tokens
reasoning tokens
wall-clock time
worker tool-call count by tool
failed tool calls
repair attempts
parent interventions / steering
files changed
```

Also inspect at least one child session-init record from each arm and record the effective system-prompt size/tool list if OMP exposes them. This is necessary to distinguish "restricted custom agent" from the stronger claim "minimal provider-facing harness".

### Decision rule

Do not optimize for token count alone. Prefer `luna-code` as the routine worker if it is non-inferior on correctness and human intervention while showing a repeatable reduction in one or more of:

- uncached/input tokens;
- unnecessary tool calls or exploration;
- retries/repair loops;
- wall time;
- director duplication.

If it is worse, inspect whether the failure came from missing tools, bounded-executor guidance, task routing, or base OMP prompt overhead before changing the model effort.

## Phase 2 — Parent-context pull A/B

### Question

Can a worker reliably recover accepted decisions from `history://<parent-agent-id>` without the director rewriting the whole conversation into the dispatch?

### Arms

```text
A: explicit long brief containing all accepted requirements
B: short intent + scope + parent-history URI
```

Use the same custom worker, model, repository fixture, and acceptance checks.

Construct a parent discussion that contains:

- several explicit accepted decisions;
- at least one older decision superseded later;
- at least two rejected/tentative alternatives;
- one open question that must not become a requirement.

The worker output should be scored for both inclusion and exclusion: it must implement/document accepted decisions and must not encode rejected or unresolved ideas.

Measure total director + worker tokens, not worker tokens alone. A history-pull strategy is useful only if it reduces expensive restatement without degrading interpretation.

### Gate

Keep the Referenced context policy only if repeated runs show the worker can distinguish accepted/superseded/tentative material. If exact wording matters, require targeted retrieval of the original passage rather than trusting summaries.

## Phase 3 — Persistent worker reuse

### Question

Does reusing one persistent worker for a coherent workstream reduce rediscovery and total cost without causing stale-context errors?

Compare:

```text
A: spawn a fresh luna-code worker for each of three related follow-ups
B: spawn once, then continue the same worker through hub messages
```

The three tasks should build on the same subsystem and require some shared repository understanding. Record repeated read/grep activity, tokens, time, repair count, and correctness.

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

Only after Phases 1–4 are stable, run normal project work for multi-hour windows and measure the actual objective: useful completed work per human hour and per Business quota window.

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
3. Phase 1 shows `luna-code` is at least operationally viable versus bundled sonic;
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
