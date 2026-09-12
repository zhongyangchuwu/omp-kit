# Validation record

Date: 2026-09-12

## Current branch validation

Current validated branch/head:

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

## Earlier runtime evidence

Before the final path/profile correction, the same machine established the following runtime behavior on the Harness v2 implementation line:

- AutoDL skill-local suite: **60 passed**.
- Skill Authoring suite: **6 passed**.
- Installer dry-run, isolated copy install, idempotent reinstall, headless overlay, rollback, and doctor checks: passed.
- `omp models cpa`: Astra, Sol, Terra and Luna recognized.
- Non-interactive CPA/Luna request: passed with the expected sentinel response.
- Native profile install at `~/.omp/profiles/harness-v2-test/agent`: passed.
- Native profile custom `luna-code` task delegation and parent verification: passed.
- Two-arm coding experiment: both implementations passed independent focused verification, but the comparison was invalid for worker-harness conclusions because the treatment used an arbitrary `PI_CODING_AGENT_DIR` path that did not expose custom task agents.

The historical raw record is `docs/HARNESS_V2_LOCAL_TEST_REPORT.md`. Its older test counts describe the commit tested at that time and are retained for auditability.

## Architecture corrections established by testing/review

### Native task-agent topology

OMP 18.1.18 did not discover custom task agents from an arbitrary `PI_CODING_AGENT_DIR` in local testing, although config/models/skills could load there. Harness v2 therefore treats OMP's native default/profile roots as the full custom-agent topology and reports arbitrary managed roots as incomplete in `doctor` for this version-scoped compatibility case.

### OMP root and profile semantics

The installer now mirrors OMP's relevant path semantics rather than reusing omp-kit resource naming rules:

- `PI_CONFIG_DIR` changes the home-relative native config root;
- named profiles resolve below that root;
- `default` selects the default native root;
- profile names follow OMP's profile grammar and reserved-name restrictions;
- a non-default active `OMP_PROFILE`/legacy `PI_PROFILE` is not silently ignored by a bare installer invocation.

### Prepared fingerprint typing

The Pyright issue in `prepare()` was fixed by checking each prepared fingerprint before returning it, so the returned mapping cannot contain `None` for an expected install unit.

## Next validation phase

Installer/config portability is no longer the primary unknown on the validated Linux/WSL2 machine. Runtime experiments should now test the behavior that motivated Harness v2:

1. bundled `sonic` versus custom restricted `luna-code`, holding Luna High/model/config constant;
2. long explicit task briefs versus short intent + parent-history retrieval;
3. persistent worker reuse versus repeated fresh workers;
4. Notes-backed context rollover/recovery;
5. multi-hour real-work quota/endurance after the above behavior is stable.

See `docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md` for the protocol and merge gate.

## Remaining scope limits

Not yet proven:

- native Windows/macOS installation;
- browser relay and fresh-profile browser automation;
- fresh-profile LSP behavior;
- Notes-backed long rollover/recovery;
- worker park/revive/reuse behavior;
- all provider/model live routes;
- ChatGPT Business quota/accounting semantics;
- default-root replacement after shutting down all live OMP sessions.

Static checks and one successful provider path do not establish those claims.
