# OMP Kit

A personal Oh My Pi harness with model-neutral custom agents, workflow skills, a
native plugin distribution path, and a legacy portable installer.

## Native core plugin trial

Current development/runtime smoke target: **OMP 18.1.19**. Previous OMP 18.1.18
plugin smoke remains historical compatibility evidence; this does not by itself raise
the minimum supported version. From a clone of this repository:

```sh
omp plugin link .
omp plugin list
```

The plugin exposes the existing `luna-code`, `luna-deep`, `luna-doc`, and `sol-review`
agents, active skills, and a Main-only workflow rule. The agents are model-neutral:
use `/agents` to set a native per-agent override, or let them inherit the normal
task/session model. This path does not install CPA, copy `config.yml`/`models.yml`, or
change ordinary OMP preferences.

To remove the linked checkout:

```sh
omp plugin uninstall omp-kit
```

## Legacy/compatibility installer

The existing Python installer remains available for Harness v2 migration and machines
that intentionally want the managed configuration snapshot. It requires **OMP and uv on
PATH**, a reachable CPA service/account, and a CPA key available to OMP. The installer
does not provision subscriptions, deploy CPA, transfer OAuth databases, install
browsers/LSPs or authenticate GitHub for you. `uv run --script` manages the installer's
Python and PyYAML dependency separately from the repository's development environment.

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
Harness v2 root in the historically validated 18.1.18 installer path. Local YAML
overrides live in `<agent-root>/.omp-kit/local/`; templates are in
`config/local.example/`. Mappings merge, arrays replace, and secret values belong in
the environment or `.env`, not those YAML files.

## Layout and policies

```text
package.json     OMP plugin package metadata and published resource roots
agents/          Model-neutral custom task agents with bounded tool surfaces
skills/          Maintained active skills; registry.yaml remains generated
rules/           Main-session workflow entry point for native plugin discovery
config/          Legacy managed settings, profiles and non-installed references
drafts/          Inactive work before promotion
scripts/         Legacy installer, static checks and maintenance tools
docs/            Current docs plus clearly separated historical archives
tests/           Repository, plugin-contract and isolated installer tests
```

Main owns intent, routing, integration, verification judgment, final reporting, and
self-hosting feedback judgment. `omp-workflow` is the default Main operating workflow
for repository work; it decides whether Main should execute directly, delegate one
bounded task, or run independent delegated work in parallel. Concrete Sol/Luna routing
remains user-owned model configuration rather than a plugin contract.

For active development, start with the [documentation map](docs/README.md) and
[shared working state](docs/WORKING_STATE.md). Current design is documented in
[architecture](docs/architecture.md), [workflows](docs/workflows.md),
[configuration](docs/omp-configuration.md), and [validation](docs/VALIDATION.md).
The [installation guide](docs/omp-installation.md) documents the supported legacy/
compatibility installer. Completed Harness v2 and native-foundation phase records live
under `docs/archive/` and are historical evidence rather than current handoffs.

## Maintenance

```sh
just verify                     # combined deterministic repository gate
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
