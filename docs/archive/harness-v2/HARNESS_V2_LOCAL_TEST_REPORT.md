# Harness v2 local validation report

> Historical test record. This document originated as an untracked local validation note for commit `005be43` and was later committed for auditability. Statements below about files being “unstaged” or “untracked” describe the local working tree at the time of the experiment, not the current Git state.

## Purpose

Local machine validation of commit `005be43` on branch `harness-v2-implementation`, covering repository tests, managed installation, OMP 18.1.18 runtime loading, CPA/Luna requests, custom task-agent discovery, and one coding A/B experiment.

## Result

**Partially ready.** Repository tests, installer transactions, configuration parsing, CPA/Luna requests, and native-profile custom-agent delegation passed. One runtime integration boundary needed a second architecture pass: an arbitrary `PI_CODING_AGENT_DIR` loaded config/models/skills but OMP 18.1.18 did not discover custom task agents from that directory. The same installed files worked when placed in OMP's native named-profile path and launched with the matching `--profile`.

The default live root `~/.omp/agent` was previewed but not overwritten because two `omp --continue` processes were active. This followed the installer's explicit shutdown requirement.

## Second-round topology correction

Based on the runtime evidence below, the installer was updated locally to:

- ignore `PI_CODING_AGENT_DIR` and legacy `AGENT_ROOT` for the default installer root;
- target the native OMP default root;
- add `--omp-profile <name>` for native OMP profile paths, with the matching
  `omp --profile <name>` launch command;
- rename the kit overlay option to `--config-profile`, retaining `--profile` as a
  compatibility alias;
- make `doctor` report incomplete for managed custom agents outside native OMP roots.

The focused installer suite increased from 37 to 41 tests and passed after those
changes. The tracked durable summary is in `docs/VALIDATION.md`.

A later GitHub review identified additional path-compatibility issues around
`PI_CONFIG_DIR`, OMP's exact profile-name grammar, the `default` profile sentinel,
and active `OMP_PROFILE`/`PI_PROFILE` handling. Those follow-up fixes are recorded in
`docs/VALIDATION.md`; the original 41/79/145-pass counts below predate that patch and
must be treated as historical evidence rather than proof of the current head.

## Repository and static checks

| Check | Observed result |
| --- | --- |
| `uv run python -m pytest -q tests/test_install_harness.py` | 41 passed |
| `just test` | 79 passed |
| `uv run --group dev python -m pytest` in `skills/autodl` | 60 passed |
| `uv run python -m pytest skills/skill-authoring/tests` | 6 passed |
| `just validate-harness` | valid; explicitly not an upstream OMP schema/runtime test |
| `just check-registry` | registry up to date |
| `just validate-registry` | registry valid |
| Python compilation of `install_harness.py` and `harness_config.py` | passed |
| `bash -n install.sh` | passed |
| `git diff --check` | passed |

Total durable pytest cases executed across the root and skill-local suites: **145 passed**.

## Local issue found and fixed

LSP/Pyright reported a real return-type error in `scripts/install_harness.py:prepare`: the fingerprint comprehension returned `dict[str, str | None]` while the function contract requires `dict[str, str]`.

Local fix:

- fingerprint each prepared unit explicitly;
- raise `InstallError` if a supposedly prepared unit is missing;
- return only non-null digests.

Post-fix evidence:

- Pyright error removed;
- targeted installer suite: 41 passed;
- complete root suite: 79 passed;
- Python compilation and `git diff --check`: passed.

## Installer transaction exercise

### Filesystem-isolated root

Installed to `/tmp/omp-kit-runtime.lznJS7` rather than the owner's live root.

Observed:

1. `--force --dry-run` listed 22 managed units and left the target directory empty.
2. Real install copied config, models, APPEND_SYSTEM, four agents, and active skills.
3. Reinstall reported every unit `unchanged`.
4. `--doctor` found `omp`, matched every managed fingerprint, and detected required key variables without printing values.
5. Applying `--config-profile headless` replaced only `config.yml`; the legacy `--profile headless` alias remained accepted. Runtime output contained `symbolPreset: ascii` and `browser.enabled: false`.
6. `--rollback` restored the prior manifest/options and restored the exact original `config.yml` SHA-256.

### Native OMP profile

Installed to OMP's native profile path:

```text
~/.omp/profiles/harness-v2-test/agent
```

Launch form:

```sh
omp --profile harness-v2-test ...
```

Observed:

- install and doctor passed;
- CPA models were available;
- custom `luna-code` delegation succeeded;
- the child created `output.txt` from `input.txt`;
- the parent independently verified the uppercase content, including the trailing newline.

### Default live root

`bash install.sh --force --dry-run` against `~/.omp/agent` completed and showed the expected replacements/installations. No live files were changed because two OMP sessions were active. Replacing config and skills while those sessions run would violate the installer's documented safety requirement.

## Real OMP and CPA checks

Using the installed harness on this machine:

- OMP version: `18.1.18`.
- `omp models cpa` recognized all four configured CPA models: Astra, Sol, Terra, and Luna.
- Non-interactive Luna request returned the exact sentinel `HARNESS_RUNTIME_OK`.
- This proves local config/model parsing, CPA endpoint reachability, authentication, request execution, and response streaming for that path.
- It does not prove quota semantics, declared context limits, long-stream stability, or every model role.

## Configuration / agent / workflow boundary review

### Boundaries that held

- `config/config.yml` owns concrete role-to-model selection and effort.
- Agent files reference roles rather than duplicating fixed thinking levels.
- `config/APPEND_SYSTEM.md` is a small workflow entry point rather than a duplicated orchestration manual.
- `omp-workflow` owns delegation/context/gate guidance; `bounded-executor`, `omp-test`, `omp-debug`, and `omp-review` retain specialist procedures.
- Code workers have `write`; the documentation worker lacks execution tools and is required to report that limit; the reviewer is read-only and requires diff/base evidence.
- Nested spawning, prewalk, and advisor are disabled in the four custom definitions.
- Actual OMP execution used hashline editing successfully in the coding experiment.

### Integration defect / architectural risk

**Observed:** with `PI_CODING_AGENT_DIR=/tmp/omp-kit-runtime.lznJS7`, OMP loaded the installed config/models/skills and completed Luna requests, but `luna-code` was unavailable to the task tool. It fell back to bundled `task`.

**Control experiment:** the same repository agent definition installed under `~/.omp/profiles/harness-v2-test/agent` and launched with `omp --profile harness-v2-test` was discovered and executed successfully.

**Root cause evidence in installed OMP 18.1.18:** task-agent discovery built user agent paths from the native OMP config/profile directory under the user's home, while `PI_CODING_AGENT_DIR` was not used by that discovery path. This created a partial-root condition: config/models could load from the override while custom agents did not.

**Applied second-round architecture correction:**

1. The installer targets OMP's native default agent root instead of following arbitrary `PI_CODING_AGENT_DIR` or legacy `AGENT_ROOT` overrides implicitly.
2. `--omp-profile <name>` installs to OMP's native named-profile path and prints the matching launch command.
3. Kit overlays use `--config-profile`; `--profile` remains a compatibility alias.
4. `doctor` warns and returns incomplete when managed custom agents are outside native OMP topology.
5. The issue remains version-scoped because OMP discovery behavior may change upstream.

## Coding A/B experiment

### Protocol

Same machine, same CPA Luna model, same prompt, two identical temporary Python projects. The task required fixing a `median` function for odd/even values, preserving input, rejecting empty input, not modifying tests, and running verification.

- **A / baseline:** current default OMP root.
- **B / Harness v2 render:** isolated installed root selected with `PI_CODING_AGENT_DIR`.

### Functional result

Both runs:

- edited only `calculator.py`;
- produced correct but slightly different implementations;
- preserved the input;
- raised `ValueError` on empty input;
- passed a direct behavior smoke check;
- reported that bare system `python -m pytest` could not run because system Python had no pytest.

Independent verification used:

```sh
uv run --with pytest python -m pytest -q
```

Result: **2 passed** for A and **2 passed** for B.

### Recorded model-event statistics

These are one-run OMP event totals. Cost is the configured estimate, not verified billing.

| Metric | A baseline | B Harness v2 render |
| --- | ---: | ---: |
| model requests with non-zero usage | 2 | 3 |
| input tokens | 1,171 | 22,813 |
| cache-read tokens | 46,080 | 37,888 |
| output tokens | 429 | 465 |
| total tokens | 47,680 | 61,166 |
| reasoning tokens | 176 | 151 |
| configured estimated cost | 0.0016706 | 0.00587836 |
| model-event span | 14.11 s | 18.43 s |

### Interpretation limits

No winner should be selected from this sample:

- one run per arm;
- cache state differed;
- the temporary project intentionally lacked dependency metadata;
- B used the arbitrary-root path that does not expose custom task agents;
- both produced correct code and both missed the available `uv --with pytest` recovery path.

A useful second experiment should use a small real project with a committed `pyproject.toml`, run at least 5 alternating repetitions per arm, capture tool failures/retries/usage, and use the native `--profile harness-v2-test` treatment so the full custom-agent surface is active.

## Remaining unverified areas

- Replacing the default live native agent root while all OMP processes are closed.
- Native Windows PowerShell and macOS execution.
- Browser relay and real browser automation under the installed profile.
- LSP behavior inside a fresh installed-profile session.
- Notes-backed rollover and recovery through long-context compaction.
- Worker park/revive/reuse across sessions.
- CPA quota/accounting semantics and declared context/output limits.
- Astra, Sol, Terra, and DeepSeek live request paths.

## Historical local state at the end of the experiment

At the moment this report was first written locally:

- installed native test profile: `~/.omp/profiles/harness-v2-test/agent`;
- temporary experiment data: `/tmp/omp-kit-ab`, `/tmp/omp-kit-agent-smoke*`, `/tmp/omp-kit-runtime.lznJS7`;
- the installer type fix had not yet been committed;
- this report itself had not yet been tracked;
- the default live root had not been modified.

Those statements are retained only as an experiment snapshot and do not describe the current repository state.
