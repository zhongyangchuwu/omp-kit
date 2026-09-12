# Validation record

Date: 2026-09-12

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

This validates the second-round installer corrections for:

- `PI_CONFIG_DIR` native-root derivation;
- OMP profile grammar;
- the `default` profile sentinel;
- `OMP_PROFILE` / `PI_PROFILE` precedence;
- explicit root/profile selection when an active profile is present;
- historical validation-report wording and regression coverage.

No local test failure or working-tree residue was reported at this head.

## Runtime Phase 1 — bundled sonic vs custom luna-code

Phase 1 ran on omp-kit commit `eebeb1ac1b992cf754930cf50b1a29c547867187` with OMP 18.1.18 inside the same native profile (`harness-v2-test`). The parent was `cpa/gpt-5.6-sol:medium`; both worker arms resolved through `@fast_worker` to `cpa/gpt-5.6-luna:high`.

Protocol: five deterministic Python coding fixtures, alternating arm order, pristine copies per arm, explicit direct task-agent selection, and independent `python -m unittest discover -v` verification after every run. No Vibe mode, fallback, tracked-file modification, or parent steering occurred.

Observed result:

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

Descriptively, `luna-code` used **28.4% fewer total tokens**, **11.9% less aggregate wall time**, **37.5% fewer enabled tool entries**, and a **35.7% shorter session-init system prompt**. Total-token reduction appeared in all five paired tasks. The aggregate token reduction was driven mainly by cache-read tokens (**37.4% lower**); uncached/input tokens were effectively flat (**0.6% higher**). Therefore this experiment does **not** establish an equivalent reduction in ChatGPT Business quota consumption.

The child runtime evidence confirms that tool restriction is real, but the custom agent still receives a substantial OMP child harness. This is evidence for a narrower worker action/prompt surface, not for a minimal provider-facing system prompt.

Decision: **keep `luna-code` unchanged**. It matched `sonic` on independent correctness in this sample while showing lower descriptive total-token/tool/wall-time activity. The sample is small and homogeneous, so no broader reliability or cost claim is made.

## Runtime Phase 2 — real history://Main smoke

The initial synthetic-parent approach was abandoned as invalid experimental scaffolding. Unbounded/long `hub wait` measured coordination waiting rather than model inference, and successful message delivery was not treated as proof that every intended steering turn had reached durable history. The valid test used the actual Main session directly.

Topology:

```text
real Main session
-> history://Main preflight/barrier
-> one luna-code worker
-> independent scorer
```

Preflight established:

- `history://Main` existed and was readable;
- the transcript visibly contained accepted, superseded, rejected, and unresolved material;
- the child was actually `luna-code`;
- model was `cpa/gpt-5.6-luna`, thinking level `high`;
- `resolvedModelIsFallback: false`;
- the preflight child read `history://Main` once.

The implementation worker received only the objective, temporary fixture path, and `history://Main`; it did not receive a rewritten final requirements brief.

Observed worker evidence:

- actual agent: `luna-code`;
- history reads: 1;
- wall time: about 85 seconds;
- total child tokens: 200,731;
- modifications were confined to the temporary fixture;
- tracked omp-kit working tree was unchanged;
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

This is one successful context-interpretation smoke, not a reliability benchmark. It supports the architectural claim that a `luna-code` worker can, at least once, recover current accepted decisions from a real long `history://Main` transcript while excluding superseded/rejected/open material and grounding a repository fact independently.

The 200,731-token child total is not interpreted as a Business-quota measurement, but it is a practical signal that a long Main transcript can be context-heavy. A compact materialized decision view/capsule remains a possible future optimization if repeated real work shows history reconstruction to be a material latency/quota cost. It is not required by current correctness evidence.

Decision: the current merge gate requiring **one parent-history pull without decision pollution is satisfied**. Do not spend additional benchmark time on Phase 2 before testing the next lifecycle layer.

## Earlier runtime evidence

Before the final path/profile correction, the same machine established the following runtime behavior on the Harness v2 implementation line:

- AutoDL skill-local suite: **60 passed**.
- Skill Authoring suite: **6 passed**.
- Installer dry-run, isolated copy install, idempotent reinstall, headless overlay, rollback, and doctor checks: passed.
- `omp models cpa`: Astra, Sol, Terra and Luna recognized.
- Non-interactive CPA/Luna request: passed with the expected sentinel response.
- Native profile install at `~/.omp/profiles/harness-v2-test/agent`: passed.
- Native profile custom `luna-code` task delegation and parent verification: passed.
- An earlier two-arm coding experiment completed functionally but was invalid for worker-harness conclusions because the treatment used an arbitrary `PI_CODING_AGENT_DIR` path that did not expose custom task agents.

The historical raw record is `docs/HARNESS_V2_LOCAL_TEST_REPORT.md`. Its older test counts describe the commit tested at that time and are retained for auditability.

## Architecture corrections established by testing/review

### Native task-agent topology

OMP 18.1.18 did not discover custom task agents from an arbitrary `PI_CODING_AGENT_DIR` in local testing, although config/models/skills could load there. Harness v2 therefore treats OMP's native default/profile roots as the full custom-agent topology and reports arbitrary managed roots as incomplete in `doctor` for this version-scoped compatibility case.

### Parent lifecycle and history barrier

For context-transfer validation, a synthetic parent held open with `hub wait` is the wrong abstraction. Long waits measure lifecycle waiting and can interact with steering delivery. The safer runtime pattern is:

```text
agent completes turn
-> yield/park
-> later direct message revives it
```

When another worker depends on parent history, successful message delivery alone is not enough. Verify the intended transcript is actually readable from `history://<parent-id>` before dispatching the dependent worker.

### OMP root and profile semantics

The installer mirrors OMP's relevant path semantics rather than reusing omp-kit resource naming rules:

- `PI_CONFIG_DIR` changes the home-relative native config root;
- named profiles resolve below that root;
- `default` selects the default native root;
- profile names follow OMP's profile grammar and reserved-name restrictions;
- a non-default active `OMP_PROFILE`/legacy `PI_PROFILE` is not silently ignored by a bare installer invocation.

### Prepared fingerprint typing

The Pyright issue in `prepare()` was fixed by checking each prepared fingerprint before returning it, so the returned mapping cannot contain `None` for an expected install unit.

## Next validation phase

Phase 1 custom-worker viability and the Phase 2 single real-parent-history smoke gate are satisfied. Next:

1. one three-step persistent `luna-code` workstream using park/revive continuation;
2. one Notes-backed context rollover/recovery smoke;
3. multi-hour real-work quota/endurance after the above behavior is stable.

See `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the minimal protocol and merge gate.

## Remaining scope limits

Not yet proven:

- repeated parent-history pull reliability or quota efficiency;
- persistent worker park/revive/reuse behavior;
- Notes-backed long rollover/recovery;
- native Windows/macOS installation;
- browser relay and fresh-profile browser automation;
- fresh-profile LSP behavior;
- all provider/model live routes;
- ChatGPT Business quota/accounting semantics;
- default-root replacement after shutting down all live OMP sessions.

Static checks and bounded runtime experiments do not establish those claims.
