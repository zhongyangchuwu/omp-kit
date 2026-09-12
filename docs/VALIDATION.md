# Validation record

Date: 2026-09-13

## Current branch validation

Current validated installer/config head:

```text
branch: harness-v2-implementation
head:   a99dd42b
```

Environment: Linux/WSL2, Python 3.12.12, OMP 18.1.18, CPA reachable at the configured local endpoint.

The post-review path/profile patch was synchronized locally with `git pull --ff-only`; the working tree was clean and matched the remote branch.

Current regression evidence:

- `uv run python -m pytest -q tests/test_install_harness.py`: **50 passed**.
- `just test`: **88 passed**.
- `just validate-harness`: passed (`Static configuration and agent/skill references: valid`).
- `just check-registry`: passed (`registry.yaml is up to date`).
- `just validate-registry`: passed.
- `git diff --check`: passed.

This validates the second-round installer corrections for `PI_CONFIG_DIR`, native OMP profile semantics, the `default` sentinel, active profile precedence/override behavior, historical-report wording, and regression coverage.

## Runtime Phase 1 — bundled sonic vs custom luna-code

Phase 1 ran on omp-kit commit `eebeb1ac1b992cf754930cf50b1a29c547867187` with OMP 18.1.18 inside the same native profile (`harness-v2-test`). The parent was `cpa/gpt-5.6-sol:medium`; both worker arms resolved through `@fast_worker` to `cpa/gpt-5.6-luna:high`.

Five deterministic Python fixtures were run in alternating A/B order with pristine copies and independent verification after every run.

| Metric | bundled `sonic` | custom `luna-code` |
| --- | ---: | ---: |
| Runs / independent passes | 5 / 5 | 5 / 5 |
| Provider requests | 35 | 35 |
| Input tokens | 144,582 | 145,424 |
| Cache-read tokens | 482,816 | 302,080 |
| Output tokens | 7,310 | 7,134 |
| Reasoning tokens | 3,493 | 3,639 |
| Total tokens | 634,708 | 454,638 |
| Mean wall time | 54.65 s | 48.13 s |
| Effective session-init tools | 16 | 10 |
| Mean session-init system prompt | 26,808.8 chars | 17,245 chars |
| Total observed tool calls | 54 | 44 |
| `read` calls | 31 | 19 |

Decision: **keep `luna-code` unchanged**. It matched `sonic` on independent correctness in this sample while showing lower descriptive total-token/tool/wall-time activity. The token reduction was dominated by cache-read tokens, so it is not a direct Business-quota claim.

## Runtime Phase 2 — real history://Main smoke

The initial synthetic-parent approach was discarded because long `hub wait` intervals measured coordination waiting rather than model inference and did not cleanly guarantee durable transcript state.

The valid topology was:

```text
real Main session
-> history://Main preflight/barrier
-> one luna-code worker
-> independent scorer
```

The worker received only the objective, temporary fixture path, and `history://Main`; it did not receive a rewritten final requirements brief.

Observed child evidence:

- actual agent: `luna-code`;
- model: `cpa/gpt-5.6-luna`, thinking level `high`;
- `resolvedModelIsFallback: false`;
- history reads: 1;
- wall time: about 85 seconds;
- total child tokens: 200,731;
- edits confined to the temporary fixture;
- focused worker test: 3 passed.

Independent scorer:

```text
accepted_correct: 3/3
superseded_incorrect: 0
rejected_tentative_incorrect: 0
unresolved_incorrect: 0
repository_facts_correct: 1/1
behavioral_pass: true
```

This satisfies the one-shot parent-history merge gate. It does not establish repeated reliability or quota efficiency. The 200,731-token child total is a practical signal that reading a long Main transcript can be context-heavy.

## Runtime Phase 3 — persistent same-session continuation

**PASS.** One `luna-code` worker handled three related tasks in one session across two direct-message wakeups.

Observed evidence:

- agent: `luna-code`;
- model: `cpa/gpt-5.6-luna`, thinking level `high`;
- `resolvedModelIsFallback: false`;
- one session id handled Task 1, Task 2 and Task 3;
- status after each task was `idle`;
- the two direct follow-ups reported `woken`;
- no silent respawn, fallback, extra worker, or unbounded `hub wait` occurred;
- Task 2 reused the helper created in Task 1;
- Task 3 correctly applied a new decision that superseded the earlier separator choice;
- final independent verification passed with 3 tests;
- total child tokens: 255,433;
- end-to-end session wall time: about 3m24s;
- tracked omp-kit working tree remained clean.

One bounded edit-placement error in Task 1 was repaired by the worker after rereading the file and did not indicate a lifecycle or stale-context failure.

Important wording: this run proves **persistent same-session continuation and idle -> woken wakeup**. It did not separately prove a `parked -> revived` transition, and that stronger lifecycle claim is not required by the current merge gate.

## Runtime Phase 4 — Notes-backed rollover/recovery

**PASS, with one tooling anomaly recorded.** The Main session formed an explicit decision, persisted it in context notes, entered a new context window, recovered the decision from the automatically supplied notes-backed context, recovered exact pre-rollover evidence through `history://current/full`, and completed a decision-dependent task correctly.

Pre-rollover accepted state:

- implement `render_notice(label)`;
- trim surrounding whitespace;
- preserve original case;
- return exactly `NOTICE | <label>`;
- supersede the older `NOTE: <label>` behavior;
- leave empty-label validation unresolved.

Recovery evidence:

- `new_context` successfully entered a fresh context window;
- the new window automatically received accepted, superseded and open state from notes;
- targeted search of `history://current/full` found marker `PHASE4-EVIDENCE-7C91-NOTICE-PIPE` at line 30138;
- lines 30131-30138 recovered the exact pre-rollover decision text;
- the resulting implementation was `return f"NOTICE | {label.strip()}"`;
- `python -m unittest -v test_notice.py`: 2 tests passed;
- direct behavior checks confirmed trimming, mixed-case preservation, exact prefix, absence of stale `NOTE:`, and no invented empty-label validation;
- tracked omp-kit working tree remained clean.

### Known runtime tooling defect: context_notes schema/documentation mismatch

The exposed `context_notes` schema requires `text`, while its documentation says omitting `text` reads the notebook. Passing an empty string clears the notebook. The issue was submitted through `xd://report_issue`; the notebook was restored afterward.

This defect did **not** invalidate the rollover gate because the post-rollover decision was already present in automatically injected notes-backed context and exact evidence remained recoverable from full history. Treat the empty-string behavior as a known non-blocking tooling defect and avoid using an empty-string call as a read operation.

## Search-first parent-history policy smoke

**PASS for correctness and retrieval policy; not evidence of context/token reduction.** One `luna-code` worker searched the real `history://Main` transcript instead of receiving a rewritten requirements brief or issuing an unbounded whole-history read.

Worker identity:

- session id: `01a096a9-d277-77b5-9862-3af0c19b59c4`;
- agent: `luna-code`;
- model: `cpa/gpt-5.6-luna`, thinking level `high`;
- fallback: false.

History retrieval:

- 3 `grep` calls against `history://Main`;
- 5 bounded line-range reads;
- no unbounded `read history://Main`;
- successful bounded ranges collectively covered nearly all of the then-188-line concise transcript, with one final out-of-range read returning no content.

Independent scorer:

```text
accepted_correct: 3/3
superseded_incorrect: 0
rejected_tentative_incorrect: 0
unresolved_incorrect: 0
repository_facts_correct: 1/1
behavioral_pass: true
```

Worker focused test and independent reruns passed. Tracked omp-kit files remained unchanged and old Phase 2 evidence was not modified.

Usage observed:

```text
total child tokens: 642,661
input:               68,928
cache read:         570,880
output:                2,853
reasoning:             1,611
wall time:            ~1m42s
```

The earlier Phase 2 whole-history smoke observed 200,731 total child tokens, but the Main history/runtime state differed, so this is not a controlled cost or quota comparison. The result proves that direct worker search of the parent's automatic transcript can recover the correct requirements without Main rewriting a detailed brief. It does **not** prove that search-first automatically reduces model context or total token traffic.

Policy implication: retain search-first Referenced retrieval, but optimize for both relevance and retrieval round trips. If matches are dense, prefer one coherent bounded span rather than mechanically tiling most of the transcript. A broader/full concise transcript read remains a fallback when most of a short transcript is genuinely relevant.

## Runtime gate status

```text
Phase 1  restricted luna-code viability        PASS
Phase 2  real history://Main retrieval          PASS
Phase 3  persistent same-session continuation   PASS
Phase 4  Notes-backed rollover/recovery         PASS
Policy   search-first parent retrieval          PASS (correctness/retrieval)
```

The bounded runtime merge gates are satisfied. Multi-hour endurance/quota work is deferred optimization rather than a merge blocker.

## Architecture corrections established by testing/review

### Native task-agent topology

OMP 18.1.18 did not discover custom task agents from an arbitrary `PI_CODING_AGENT_DIR` in local testing, although config/models/skills could load there. Harness v2 therefore treats OMP's native default/profile roots as the full custom-agent topology and reports arbitrary managed roots as incomplete in `doctor` for this version-scoped compatibility case.

### Parent lifecycle and history barrier

For context-transfer validation, a synthetic parent held open with `hub wait` is the wrong abstraction. Long waits measure lifecycle waiting and can interact with steering delivery. Downstream work that depends on parent history should verify the intended transcript is actually readable before dispatch rather than equating successful message delivery with durable transcript availability.

### OMP root and profile semantics

The installer mirrors OMP's relevant path semantics rather than reusing omp-kit resource naming rules: `PI_CONFIG_DIR` changes the home-relative native config root, named profiles resolve below it, `default` selects the default native root, profile names follow OMP grammar/reserved-name restrictions, and active `OMP_PROFILE`/legacy `PI_PROFILE` is not silently ignored.

### Prepared fingerprint typing

The Pyright issue in `prepare()` was fixed by checking each prepared fingerprint before returning it, so the returned mapping cannot contain `None` for an expected install unit.

## Next work

Stop runtime/context smoke expansion. Perform a final branch review for policy consistency, stale documentation, accidental overclaiming, installer/config regressions, and merge readiness before deciding whether to merge `harness-v2-implementation` to `main`.

## Remaining scope limits

Not yet proven:

- repeated parent-history pull reliability or Business-quota efficiency;
- search-first token/context efficiency on controlled equivalent sessions;
- true `parked -> revived` worker lifecycle across longer inactivity/process boundaries;
- native Windows/macOS installation;
- browser relay and fresh-profile browser automation;
- fresh-profile LSP behavior;
- all provider/model live routes;
- ChatGPT Business quota/accounting semantics;
- default-root replacement after shutting down all live OMP sessions.

These are not current bounded runtime merge-gate failures.
