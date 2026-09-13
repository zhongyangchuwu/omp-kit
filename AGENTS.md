# Repository guidelines

OMP Kit manages portable Oh My Pi configuration, model metadata, custom task agents,
skills and installation automation. Read docs/omp-configuration.md and the current
Harness v2 guide before changing runtime policy. The 2026-09-12 uploaded settings
supersede earlier guessed configurations.

## Boundaries

- config/config.yml and config/models.yml are canonical non-secret inputs.
- config/APPEND_SYSTEM.md is only a short entry point; detailed policy belongs to skills.
- config/reference/ is archival/reference material, never deployed to OMP.
- agents/*.md define restricted workers through model-role aliases.
- skills/*/resource.yaml owns skill metadata; registry.yaml is generated, not edited.
- Project-specific facts belong in docs or local project rules, not reusable skills.
- Runtime .omp-kit/local overlays, auth state and backups never belong in Git.

## Maintenance

Python targets 3.12+. Use pathlib, explicit errors, safe YAML and isolated filesystem
tests. The installer has its own uv inline dependency declaration to avoid requiring
just or the full development environment on a new machine. Do not add silent external
installer downloads, privilege escalation or live inference to installation.

`just install` invokes the copy installer. `just install-skills` is the legacy symlink
helper only. Do not mix deployment methods casually. All collisions and local drift
must be checked before writing; --force means explicit adoption with backups, not
permission to remove unrelated files. Keep rollback guarded against newer work.

## Combined checks

After completing a coherent batch of changes, run the combined deterministic gate:

```sh
just verify
```


Regenerate registry only when skill metadata changes. Use temporary agent roots for
installer tests. Never install into the user's live root merely to test a script.
Do not claim OMP/provider compatibility from YAML parsing or filesystem tests.

## Current policy constraints

Preserve the uploaded CPA /v1 Responses transport and CPA_API_KEY contract. No literal
secrets or shell-specific credential resolver is required. Preserve source concurrency
and experimental notes settings unless changing an explicit profile. Four scalar cost
fields are supported; source tier tables remain non-installed reference data.

Worker roles control models/effort; do not duplicate fixed effort in agent frontmatter.
Do not invent tools, routes, config keys or inherited history. The separate ChatGPT
conversation is not an OMP history endpoint. High-risk review needs change evidence.
