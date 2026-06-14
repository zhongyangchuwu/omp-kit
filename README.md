# OMP Kit

OMP-first skill kit. This repository keeps the active skills and drafts loaded into Oh My Pi agent runtimes.

The repository stays small on purpose:

- active resources live only in `skills/` and `drafts/`;
- `registry.yaml` is generated from resource metadata — never hand-maintained;
- installation targets OMP's native user directory at `~/.omp/agent/skills/`;
- project facts live in `docs/`, not in workflow skills;
- empty capability roots are removed instead of kept as placeholders.

## Active skills

| Skill | Risk | What it does |
| --- | --- | --- |
| `autodl` | High | AutoDL Pro GPU instance management, balance checks, SSH smoke tests |
| `code-taste` | Low | Code-level judgment for maintainability, API shape, tests, errors, performance |
| `omp-superpowers` | Medium | Superpowers workflow and decision method for non-trivial software work |
| `skill-authoring` | Low | Create, review, localize, and maintain Agent Skills |

## Draft skills

| Draft | Risk | What it is for |
| --- | --- | --- |
| `code-taste` | Low | Draft code-quality skill under refinement |
| `doc-coauthoring` | Low | Draft structured documentation workflow |
| `paper-diagram` | Medium | Draft paper-diagram workflow and SVG/PPTX pipeline |

## External references

Third-party source material lives under `references/` and is not active until reviewed and incorporated into a tracked skill, draft, or documentation artifact.

| Collection | Status |
| --- | --- |
| `references/anthropic-skills` | Source material for third-party skills and PPTX tooling |
| `references/ppt-master` | SVG/PPTX diagram-generation reference material |
| `references/compound-engineering-plugin` | Engineering workflow, review persona, and converter reference material |
| `references/agents` | Marketplace-scale agent, skill, command, and adapter reference material |
| `references/harness` | Agent-team design reference; not active |

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
just install              # symlink each ./skills/* → ~/.omp/agent/skills/
just install-force        # replace stale per-skill links under ~/.omp/agent/skills/

just link-skills          # legacy alias for just install
just link-skills-force    # legacy alias for just install-force

just build-registry       # regenerate registry.yaml from resource.yaml files
just check-registry       # fail if registry.yaml is stale
just validate-registry    # validate generated registry and resource metadata
just build-index          # print compact registry index
just scan-risk PATH       # scan a directory for risk indicators

just promote-skill drafts/NAME --name NAME  # promote reviewed draft skill into skills/

just test                 # run all repository tests
```

## Documentation

| Doc | Content |
| --- | --- |
| `docs/architecture.md` | Repository design and operating principles |
| `docs/resource-model.md` | `resource.yaml` schema, registry model, activation modes, risk levels |
| `docs/workflows.md` | Daily operations, import/promote lifecycle, installation |
| `docs/omp-runtime-notes.md` | Pi / OMP capability model reference |
| `docs/omp-installation.md` | OMP-native installation paths and checks |
| `docs/omp-configuration.md` | OMP user/project config locations relevant to this kit |
| `docs/omp-roadmap.md` | Future extension/tool/MCP/package upgrade notes |

## Rules

- `resource.yaml` is canonical; `registry.yaml` is generated. Do not edit `registry.yaml` by hand.
- Do not place unreviewed third-party skills in `skills/`.
- Do not commit caches, virtual environments, compiled files, secrets, tokens, SSH hosts, or private keys.
- After changing structure, scripts, metadata, or skills, run `just test`.
