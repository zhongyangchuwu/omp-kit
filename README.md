# Personal Skills

Canonical repository for maintained personal Agent Skills.

`registry.yaml` is the single index of record for all skills — active, staged, source, risk, and verification commands. Tests auto-validate it against the filesystem.

## Active skills

| Skill | Risk | Notes |
| --- | --- | --- |
| `autodl` | High | AutoDL Pro GPU resource and SSH operations helper. |
| `skill-authoring` | Low | Portable Agent Skills authoring, review, and maintenance guide. |
| `omp-superpowers` | Medium | Localized Superpowers collection; explicit-only activation. Upstream skills nested under `references/skills/`, not auto-discovered. |

## Staged imports

Third-party skills staged under `incoming/`. Not auto-linked until reviewed and promoted into `skills/`. See `incoming/REVIEW.md` for per-collection processing status.

## Layout

```
skills/      Active skills linked into agent runtimes.
incoming/    Staging area for third-party or draft skills before review.
docs/        Project documentation.
scripts/     Automation utilities.
tests/       Repository-level tests.
```

## Link skills to agent config

```bash
just link-skills          # symlink skills/* → ~/.agents/skills/
just link-skills --force  # replace stale symlinks and prune old names
```

## Verify

```bash
just test
```

## Maintenance rules

- `registry.yaml` is the canonical source; tests validate all skills against it.
- Do not commit runtime caches, virtual environments, compiled files, secrets, tokens, SSH hosts, or private keys.
- After editing a skill, run `just test`.
- Review staged skills in `incoming/` before moving them into `skills/`.
