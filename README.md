# Personal Skills

Canonical repository for maintained personal agent capabilities.

`registry.yaml` is the single index of record for repository resources. It records what exists, where it lives, its status, and its risk class. Detailed policy belongs beside each resource: `SKILL.md`, package manifests, tool config, extension-local metadata, or review notes.

## Active skills

| Skill | Risk | Notes |
| --- | --- | --- |
| `autodl` | High | AutoDL Pro GPU resource and SSH operations helper. |
| `skill-authoring` | Low | Portable Agent Skills authoring, review, and maintenance guide. |
| `omp-superpowers` | Medium | Localized Superpowers collection; explicit-only activation. Upstream skills nested under `references/skills/`, not auto-discovered. |

## Staged imports

Third-party skills staged under `incoming/` are not auto-linked until reviewed and promoted into active resource directories. See `incoming/REVIEW.md` for per-collection processing status.

## Layout

```text
skills/       Active skills linked into agent runtimes.
extensions/   Reserved for OMP-native runtime extensions.
tools/        Reserved for deterministic local CLIs/libraries.
packages/     Reserved for Pi/OMP installable capability bundles.
incoming/     Staging area for third-party or draft skills before review.
vendor/       Reserved for upstream mirrors, submodules, or immutable snapshots.
localized/    Reserved for reviewed/adapted candidates before promotion.
mcp/          Reserved for MCP servers and portable config examples.
docs/         Project documentation.
scripts/      Repository maintenance automation.
tests/        Repository-level tests.
```

## Documentation

- `docs/pi-omp-runtime-notes.md` explains the Pi/OMP capability model.
- `docs/architecture.md` explains this repository's resource boundaries and maintenance model.

## Link skills to agent config

```bash
just link-skills          # symlink skills/* → ~/.agents/skills/
just link-skills-force    # replace stale symlinks and prune old names
```

## Maintenance commands

```bash
just validate-registry    # validate registry.yaml and referenced paths
just build-index          # print compact registry index
just scan-risk PATH       # scan a staged/imported directory for risk indicators
just test                 # run repository tests
```

`import-skill` and `promote-skill` recipes exist as explicit placeholders for future workflow implementation.

## Maintenance rules

- Keep `registry.yaml` minimal: `path`, `status`, and `risk` only unless a future resource type needs an index-level field.
- Put detailed constraints beside the resource they govern.
- Do not commit runtime caches, virtual environments, compiled files, secrets, tokens, SSH hosts, or private keys.
- Review staged skills in `incoming/` before moving them into `skills/`, `extensions/`, `tools/`, or `packages/`.
- After changing repository structure, scripts, registry entries, or skills, run `just test`.
