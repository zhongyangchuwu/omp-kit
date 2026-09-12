# Validation record

Date: 2026-09-12

## Local machine evidence

Environment: Linux/WSL2, Python 3.12.12, OMP 18.1.18, CPA reachable at the
configured local endpoint. No default live agent root was overwritten while active
`omp --continue` sessions were running.

- `just test`: **79 passed**.
- `uv run python -m pytest -q tests/test_install_harness.py`: **41 passed** after
  the topology/CLI changes.
- AutoDL skill-local suite: **60 passed**.
- Skill Authoring suite: **6 passed**.
- Combined durable pytest cases executed: **145 passed**.
- `just validate-harness`, `just check-registry`, `just validate-registry`, Python
  compilation, `bash -n install.sh`, and `git diff --check`: passed.
- Installer dry-run, isolated copy install, idempotent reinstall, headless overlay,
  rollback, and doctor checks: passed.
- `omp models cpa`: Astra, Sol, Terra and Luna recognized.
- Non-interactive CPA/Luna request: passed with the expected sentinel response.
- Native profile install at `~/.omp/profiles/harness-v2-test/agent`: passed.
- Native profile custom `luna-code` task delegation and parent verification: passed.
- Two-arm coding experiment: both implementations passed independent `uv run
  --with pytest python -m pytest -q` checks, **2 passed** per arm.

## Architecture correction

OMP 18.1.18 does not discover custom task agents from an arbitrary
`PI_CODING_AGENT_DIR`, although config/models/skills can load there. The installer
now defaults to OMP's native default agent root, adds `--omp-profile <name>` for the
native profile topology, and reserves `--config-profile` for omp-kit overlays
(`--profile` remains a compatibility alias). `doctor` returns incomplete for managed
custom agents installed outside a native OMP root.

The installer return-type issue found by Pyright in `prepare()` was also fixed by
checking each prepared fingerprint before returning it.

## Post-review path compatibility correction

A follow-up source review against OMP 18.1.18 identified three path-selection issues
that were not covered by the 145-test local run above:

- `PI_CONFIG_DIR` is a home-relative OMP config-directory name and must affect both
  the default and named-profile install roots;
- OMP profile validation accepts `.` and `_` inside names, treats `default` as the
  default profile sentinel, and rejects reserved/pathological names using OMP's own
  grammar rather than omp-kit's kebab-case resource grammar;
- a non-default `OMP_PROFILE`/legacy `PI_PROFILE` environment selection must not be
  silently ignored by a bare installer invocation.

The branch now contains regression tests and installer changes for those cases. This
GitHub-authored follow-up has **not yet been rerun on the owner's local machine**.
Before merging to `main`, rerun at minimum:

```sh
uv run python -m pytest -q tests/test_install_harness.py
just test
just validate-harness
just check-registry
just validate-registry
git diff --check
```

The earlier counts in this document remain historical evidence for the prior tested
commit; they must not be interpreted as proof of the follow-up patch until rerun.

## Scope limits

Not proven here: native Windows/macOS, browser relay, fresh-profile LSP behavior,
notes-backed long rollover, worker park/revive, all provider/model routes, quota
semantics, and default-root replacement after shutting down live OMP sessions.
Static checks and a successful CPA request do not establish those claims.
