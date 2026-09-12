# Validation record

Date: 2026-09-12

## Executed in the development container

Environment: Linux, Python 3.13.5. No OMP process, CPA endpoint or real provider
credentials were used. Tests operate on temporary roots and never on the owner's
live agent directory.

- `PYTHONPATH=. python -m pytest -q tests/test_install_harness.py`: **37 passed**.
- Python compilation of the authored installer/config modules: passed.
- `bash -n install.sh`: passed.
- YAML parsing of all authored config/profile/reference files: passed.
- Imported config compared to uploaded config: identical parsed values except
  setupVersion and dev.autoqaConsent intentionally excluded from the portable source.
- The original APPEND_SYSTEM upload was archived byte-for-byte.
- Agent definitions checked for role indirection and disabled nested spawning.

Installer coverage includes clean/idempotent copying, no-write preview, all-conflict
preflight, local drift, explicit adoption, backups/rollback, aliases, source and parent
symlink rejection, legacy individual-link migration, new-work rollback protection,
ordinary error recovery, pending transactions/locks, local/profile/URL persistence,
secret-reference checks, and command execution from an unrelated directory.

## Scope limits

The shipped config and agent definitions were checked using isolated skill fixtures.
The entire private repository was not cloned into this test container. The original
full registry/root test suite and skill-local suites were **not rerun** here. They
remain a combined checkout gate before merging/deploying:

```sh
just validate-harness
just check-registry
just validate-registry
just test
git diff --check
```

Native PowerShell/Windows and macOS were not executed. The Windows wrapper and
copy-based design need target-machine smoke verification. OMP startup/schema parsing,
provider auth/streaming, declared model limits/effort, quotas, history routes,
notes-backed rollover, worker reuse and browser/LSP capabilities remain unverified.
Static success must not be reported as live end-to-end success.
