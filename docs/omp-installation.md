# Installation and migration

## Native plugin checkout

Use a released OMP installation and the Bun version in `package.json`. From this checkout:

```sh
bun install --frozen-lockfile
omp plugin link .
omp plugin list
```

Restart the OMP session to load changed plugin resources. Inspect the actual linked checkout and runtime errors rather than assuming that selecting a different Git branch changes an already running session.

The plugin exposes agents, maintained Skills, a Main workflow rule and the feedback extension. It does not install AutoDL credentials, external parser programs, MCP servers, model routes or normal OMP configuration.

```sh
omp plugin uninstall omp-kit
```

This removes the plugin registration, not the repository checkout or the user's sessions and feedback.

## Skill-only library use

`scripts/link_skills.py` remains an explicit helper for linking the maintained library into a chosen agent root. Read its `--help`, inspect the target and preserve user-owned files. Do not combine it with a native plugin installation that already discovers the same Skills: duplicate discovery is not an upgrade strategy.

Use the normal plugin path for omp-kit agents/rules/extensions. Skill-only links are not equivalent to installing the full plugin.

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

`omp plugin list` confirms registration, not every tool invocation. The prior feedback acceptance used OMP's explicit `--extension` workflow against an exact checkout; that is claim-specific evidence, not proof of every installation topology.

A fresh or changed installation may need a small discovery smoke. Routine documentation/library edits do not require repeating model calls when the corresponding runtime implementation has not changed.
