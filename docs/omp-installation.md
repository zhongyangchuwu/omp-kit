# OMP Installation

Pi Kit installs active skills into OMP's native user-level skill directory:

```text
~/.omp/agent/skills/<skill-name>
```

Each installed entry is a symlink back to the corresponding repository directory under `skills/`.

## Commands

```bash
just install
just install-force
```

`just install` creates one symlink per active skill. `just install-force` also replaces stale symlinks and prunes obsolete symlinks that point back into this repository's `skills/` directory.

Drafts under `drafts/` are never installed.

## Project-level installs

OMP can also discover project-level skills under `.omp/skills/`, but this repository defaults to the user-level path. Use project-level `.omp/skills/` only for project-specific capabilities that should not be available globally.

## Verification

After changing active skills or installation behavior, run:

```bash
just test
just install-force
```

Then in OMP, verify that `skill://<name>` resolves for the active skill you changed.
