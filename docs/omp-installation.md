# Installation and migration

## Development checkout

For active omp-kit development, keep one long-lived checkout and install that working tree through OMP's native local install path:

```sh
git clone git@github.com:zhongyangchuwu/omp-kit.git
cd omp-kit
just install
```

The `install` recipe runs:

```sh
bun install --frozen-lockfile
omp install .
omp plugin list
```

OMP 18.2.0 exposes `omp install <target>` as the top-level convenience command. Local filesystem targets are routed to the native plugin link flow, so the registration points at the checkout instead of copying the source into another development directory. Normal source edits and `git pull` therefore keep the same registration. Restart the OMP session after changing loaded resources; rerun `just install` when dependencies or registration change.

```sh
just check-install
just plugin-doctor
just uninstall
```

`just check-install` reports the active OMP version and plugin registration. `omp plugin doctor` evaluates the active plugin root rather than omp-kit alone, so unrelated plugin problems can also appear there.

The plugin exposes agents, maintained Skills, a Main workflow rule, the bounded feedback extension, and the current-session Assurance command extension. `/assurance` performs active-branch triage; `/assurance full` performs richer retained-Main-tree investigation and stores derived output under the active OMP agent root. The plugin does not install service credentials, external parser programs, MCP servers, model routes or normal OMP configuration.

## Remote Git installation

OMP also accepts Git plugin sources. A public repository can be installed without repository credentials, for example:

```sh
omp install github:zhongyangchuwu/omp-kit
```

A private repository does not need to be made public when the machine already has access. Use an authenticated Git source such as SSH:

```sh
omp install git@github.com:zhongyangchuwu/omp-kit.git
```

This installs a managed Git dependency under OMP's plugin root. It is appropriate for consumption, but it is not the preferred maintainer workflow because it is separate from the editable working checkout. For ongoing development, use the local checkout install/link above.

Repository visibility and package publication are separate concerns. `package.json` may remain `private: true`; OMP can load the source checkout or a Git-installed plugin without publishing an npm package.

If only a portable Skill is needed outside the full plugin, use the target runtime's normal Skill installation mechanism or an explicit reviewed copy/link. omp-kit does not maintain a second repository-specific skill installer.

## Retired Harness v2 installer

The old config-copy installer and tracked provider/config snapshot are no longer maintained. Their implementation and old rollback commands are available at the pre-cleanup revision:

[Pre-cleanup source](https://github.com/zhongyangchuwu/omp-kit/tree/47a2951f47c9c55ce8f8cb020220288f9e28f871).

This repository cleanup does **not** remove or rewrite anything previously installed in `~/.omp/agent`, named profiles or custom roots. Before migrating an old installation:

1. Identify the actual active root/profile and back up its configuration and managed-install state.
2. Distinguish copied managed resources, symlinks, native plugin registrations and user-created files.
3. Review collisions before linking the plugin. Do not overwrite or mass-delete resources based only on a matching filename.
4. Remove an obsolete managed copy only after its ownership and replacement have been verified. Preserve credentials, models, sessions, MCP settings and user overlays.
5. Restart and inspect native resource discovery in the intended profile.

Do not run a historical rollback blindly against a newer live profile. No automatic migration or new cleanup script is added by this change.

## Verification boundaries

`omp plugin list` confirms registration, not every tool invocation. `omp plugin doctor` checks the plugin root but is not a full runtime acceptance test. Prior feedback/session-evidence acceptance used exact checkouts and released OMP runtime behavior; those claims remain scoped to the evidence recorded in `VALIDATION.md`.

A fresh or changed installation may need a small discovery smoke. Routine documentation/library edits do not require repeating model calls when the corresponding runtime implementation has not changed.
