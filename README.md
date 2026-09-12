# OMP Kit

A personal Oh My Pi harness: versioned runtime configuration, model routing,
restricted custom agents, workflow skills and a portable installer.

The current settings are based on the owner's working files uploaded on
2026-09-12, not the earlier guessed CPA configuration. The CPA route is
`http://localhost:8317/v1` using `openai-responses` and `CPA_API_KEY`.

## Start on another machine

Prerequisites: **OMP and uv on PATH**, a reachable CPA service/account, and a CPA
key available to OMP. The installer does not provision subscriptions, deploy CPA,
transfer OAuth databases, install browsers/LSPs or authenticate GitHub for you.
`uv run --script` manages the installer's Python and PyYAML dependency separately
from the repository's larger development environment.

Clone this repository using your normal GitHub access, then:

```sh
# Linux / macOS / WSL; installs into OMP's native default agent root
bash install.sh --dry-run
bash install.sh
```

The native default is normally `~/.omp/agent`. If `PI_CONFIG_DIR` is set, the
installer follows OMP's home-relative config-root semantics and uses
`~/<PI_CONFIG_DIR>/agent` instead.

For a full native OMP named profile:

```sh
bash install.sh --omp-profile harness-v2-test --dry-run
bash install.sh --omp-profile harness-v2-test
omp --profile harness-v2-test
```

```powershell
# Native Windows; no symlink privileges required
.\install.ps1 --dry-run
.\install.ps1
```

The same entry point works everywhere, from any working directory:

```sh
uv run --script /path/to/omp-kit/scripts/install_harness.py
```

Supply `CPA_API_KEY` in the environment used to launch OMP or in the selected
`<agent-root>/.env` (for example `~/.omp/agent/.env` or a native profile root).
See `config/secrets.env.example`; never put real keys in Git. `DEEPSEEK_API_KEY`
is optional unless you assign a DeepSeek role.

For an existing setup, preview the explicitly authorized migration:

```sh
bash install.sh --force --dry-run
bash install.sh --force
```

All replaced objects are backed up before replacement. Close active OMP sessions
first; the installer does not lock OMP's own configuration writer.

## What is installed

```text
config/config.yml             -> <agent-root>/config.yml
config/models.yml             -> <agent-root>/models.yml
config/APPEND_SYSTEM.md        -> <agent-root>/APPEND_SYSTEM.md
agents/*.md                   -> <agent-root>/agents/*.md
registry-selected active skills -> <agent-root>/skills/<name>/
```

Default installation **copies** resources. Checkout changes do not silently alter
running workers, and native Windows does not require symlinks. Drafts, references,
credentials, caches and unrelated runtime resources are not imported.

The manifest and private backups live in `<agent-root>/.omp-kit/`. A normal update
replaces unchanged managed resources, but refuses unknown collisions and local
edits. `--force` explicitly adopts/replaces conflicts with backups. Removed managed
resources are retired only from the previous manifest, never by sweeping the directory.

## Machine differences and recovery

```sh
bash install.sh --config-profile headless       # kit overlay: ASCII UI, no browser/relay
bash install.sh --config-profile legacy-context # kit overlay: opt out of experimental notes
bash install.sh --config-profile default        # clear stored overlay selection
bash install.sh --profile headless              # compatibility alias for --config-profile
bash install.sh --omp-profile harness-v2-test   # native OMP profile root
bash install.sh --omp-profile default           # explicitly select native default root
bash install.sh --cpa-url https://my-host.example/v1
bash install.sh --doctor                        # offline readiness/drift check
bash install.sh --rollback                      # undo latest install, preserving newer work
```

`--config-profile`/`--profile` are omp-kit config overlays. `--omp-profile` is the
native OMP profile selector and is distinct from them. OMP profile names follow OMP's
own grammar, including `.` and `_`; the special value `default` selects the native
default root.

If `OMP_PROFILE` or legacy `PI_PROFILE` selects a non-default profile and no explicit
`--omp-profile`/`--agent-root` is given, the installer refuses to guess. Use
`--omp-profile <name>` to target that profile or `--omp-profile default` to make the
default-root choice explicit.

Full custom-agent discovery requires OMP's native default/profile topology. An
arbitrary `PI_CODING_AGENT_DIR` can relocate OMP state but is not treated as a full
Harness v2 root on OMP 18.1.18. Local YAML overrides live in
`<agent-root>/.omp-kit/local/`; templates are in `config/local.example/`. Mappings
merge, arrays replace, and secret values belong in the environment or `.env`, not
those YAML files.

## Layout and policies

```text
config/          User-derived portable settings, profiles and non-installed references
agents/          Role-backed custom task agents
skills/          Maintained active skills; registry.yaml remains generated
drafts/          Inactive work before promotion
scripts/         Installer, static configuration checks and existing maintenance tools
docs/            Architecture, installation, configuration and migration notes
tests/           Repository and isolated installer tests
```

Sol/Luna routing is a selected working policy, not a claim that model benchmarks
guarantee task success or a fixed weekly quota. The director sends intent and
boundaries; workers retrieve relevant evidence and stop at acceptance or escalation.
Detailed orchestration belongs to `omp-workflow`, not a large global system prompt.

Start with [installation](docs/omp-installation.md), [configuration](docs/omp-configuration.md),
and the [migration record](docs/config-migration-2026-09-12.md).
The [guide](docs/HARNESS_V2_GUIDE.md) describes current policy, the
[runtime experiment plan](docs/HARNESS_V2_RUNTIME_EXPERIMENTS.md) defines the next
measurement phase, and [validation](docs/VALIDATION.md) records what has actually
been tested. The [handoff](docs/HARNESS_V2_HANDOFF.md) is the current continuation
entry point for another agent. Future OMP-native development, Bun/TypeScript adoption
and upstream-reuse rules are recorded in the [capability roadmap](docs/omp-roadmap.md);
the [test automation plan](docs/HARNESS_V2_TEST_AUTOMATION.md) keeps the current
fallback-auditor boundary and deferred runtime-test infrastructure work.

## Maintenance

```sh
just install                    # equivalent portable installer
just validate-harness           # static config and agent/skill references
just doctor
just build-registry             # only after skill metadata changes
just check-registry
just validate-registry
just test                       # combined repository tests
```

`just` is optional for installation. Skill-local tools may need their own dependencies.
Passing static checks does not establish provider connectivity or live OMP compatibility.
