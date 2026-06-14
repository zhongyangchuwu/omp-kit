# OMP Kit

OMP-first skill kit. This repository keeps the active skills and drafts loaded into Oh My Pi agent runtimes.

The repository stays small on purpose:

- active resources live only in `skills/` and `drafts/`;
- `registry.yaml` is generated from resource metadata — never hand-maintained;
- installation targets OMP's native user directory at `~/.omp/agent/skills/`;
- project facts live in `docs/`, not in workflow skills;
- empty capability roots are removed instead of kept as placeholders.

## Layout

```text
skills/          Active skills
drafts/          In-progress skills before promotion
references/      Local upstream source/reference material (gitignored)
docs/            Project documentation
scripts/         Maintenance automation
schemas/         Resource metadata schema
tests/           Repository-level tests
registry.yaml    Generated resource index
justfile         Common maintenance entry points
```

## Quick commands

```bash
just install              # symlink active skills into ~/.omp/agent/skills/
just install-force        # replace stale installed skill links

just build-registry       # regenerate registry.yaml from resource.yaml files
just check-registry       # fail if registry.yaml is stale
just validate-registry    # validate registry and resource metadata
just build-index          # print compact registry index

just promote-skill drafts/NAME --name NAME  # promote a reviewed draft skill
just test                 # run repository tests
```

## Documentation

| Doc | Content |
| --- | --- |
| `docs/architecture.md` | Repository design and operating principles |
| `docs/skill-design.md` | Skill scope, owner domains, description standards, and duplicate-guidance rules |
| `docs/resource-model.md` | `resource.yaml` schema, registry model, activation modes, risk levels |
| `docs/workflows.md` | Daily operations, import/promote lifecycle, installation |
| `docs/omp-runtime-notes.md` | Pi / OMP capability model reference |
| `docs/omp-installation.md` | OMP-native installation paths and checks |
| `docs/omp-configuration.md` | OMP user/project config locations relevant to this kit |
| `docs/omp-roadmap.md` | Future extension/tool/MCP/package upgrade notes |

## Rules

- `resource.yaml` is canonical; `registry.yaml` is generated.
- Unreviewed third-party material stays under gitignored `references/` until extracted into a maintained resource or document.
- Project facts live in `docs/`; skill behavior lives with the owning skill.
- After changing structure, scripts, metadata, or skills, run `just test`.
