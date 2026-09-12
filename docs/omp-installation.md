# Portable installation and recovery

## Prerequisites and scope

Install OMP and uv, and clone this private repository with your own GitHub access.
Alternatively use Python 3.12+ with PyYAML already installed and execute the Python
entry point directly. The wrappers never run a curl-to-shell bootstrap or install
system packages. Their uv invocation uses inline script dependencies, not all of
`pyproject.toml` (including document-processing dependencies).

The installation can be previewed without OMP, credentials or network inference.
Actual use needs a reachable provider and credentials. Existing `.env`, `agent.db`,
other auth stores, sessions, `mcp.json`, extensions and unrelated skills are not copied,
deleted or printed by the installer. Browser/relay, LSP, language runtimes and each
project's build dependencies remain machine prerequisites for those capabilities.

## Commands

From any directory:

```sh
uv run --script /absolute/path/to/omp-kit/scripts/install_harness.py --dry-run
uv run --script /absolute/path/to/omp-kit/scripts/install_harness.py
```

For a full native OMP named profile, use the separate installer option:

```sh
bash install.sh --omp-profile harness-v2-test --dry-run
bash install.sh --omp-profile harness-v2-test
omp --profile harness-v2-test
```

`bash /path/to/omp-kit/install.sh` and PowerShell `& C:\path\omp-kit\install.ps1`
are wrappers for the same script. Native Windows defaults to copies and does not
need administrator/Developer Mode symlink permissions.

Root selection: `--agent-root` is an explicit installer-only root; `--omp-profile`
selects `~/.omp/profiles/<name>/agent`; with neither option the installer targets
`~/.omp/agent`. `PI_CODING_AGENT_DIR` is not used as the installer's default root,
because OMP 18.1.18 may load config/models/skills from an arbitrary override while
not discovering custom task agents there. A target cannot contain the repository or
be contained in it.

## Existing machine migration

Close OMP before applying an installation. Run:

```sh
bash install.sh --force --dry-run
bash install.sh --force
```

`--dry-run` renders, validates and plans; it does not create the runtime root or
change files. The first install refuses existing different files until `--force`
authorizes adoption. Matching files can be adopted without replacement.

A transaction stages all content, checks all conflicts before writes, backs up
replaced objects, updates files, and records a manifest. If an ordinary application
error or Ctrl-C occurs, applied changes are restored. A crash/power loss leaves a
transaction journal requiring rollback before another install.

Backups use private directories under `.omp-kit/backups/<transaction>/`. They may
contain old secrets; do not upload them or place them in Git. File permissions on
Windows follow your user directory/ACL environment; POSIX directories use mode 0700.

Existing `config.yaml` / `models.yaml` are backed up and retired under the same
explicit adoption rules so they cannot ambiguously coexist with canonical `.yml`.
An individual old skill symlink can be backed up and replaced without modifying its
source. A **parent** `skills/` or `agents/` symlink/junction is refused: migrate that
parent to a real directory deliberately before installing.

After `git pull`, run the installer again. If an installed managed unit still
matches its last-deployed fingerprint, a newer repository version can replace it.
If a local edit or an OMP settings write changed it, installation refuses to silently
lose it. Move intended non-secret differences into local overrides, preview, then
use `--force` to accept the replacement. Pure formatting changes can also cause
byte-level drift; fingerprints are deliberately conservative.

Changing a config profile can change runtime config. `--config-profile` accepts
repeated named overlays; `--profile` remains a compatibility alias;
`--config-profile default` alone clears remembered overlays. A chosen CPA URL and
custom `--local-dir` are also remembered. `--cpa-url` validates a plain HTTP(S)
base URL and rejects embedded credentials, queries and fragments.

## Rollback

```sh
bash install.sh --rollback
```

This restores the latest installed transaction (or interrupted pending transaction)
and its previous manifest. It refuses to overwrite work changed since installation.
Restore/record that local work first; there is no destructive rollback-force option.
Credentials and unrelated files are not in the transaction.

The installer uses `.omp-kit/install.lock` to exclude concurrent installations.
After a hard process kill, inspect the recorded PID and confirm no installer is
running before removing a stale lock. Do not remove manifests to bypass checks.
Then use `--rollback` to recover any pending transaction.

## Readiness

```sh
bash install.sh --doctor
```

Doctor is offline: it checks the OMP executable, managed-file drift and named key
presence in the environment or `<agent-root>/.env`, without printing values or
opening auth databases. Exit 2 means readiness is incomplete. It does not call a
model, check quotas, validate a bearer token, or prove the CPA endpoint is reachable.

After first install, launch/restart OMP, inspect `/model` and `/agents`, and confirm
the required context-management tools before long work. Project `.omp/` settings,
project APPEND_SYSTEM.md and other discovery providers can override user-level
configuration; inspect the effective session, not just the installed files.
