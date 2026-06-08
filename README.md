# Pi Kit

Pi / Oh My Pi capability workbench. This repository manages the skills, extensions, MCP resources, tools, and packages loaded into Pi-oriented agent runtimes.

Agent capabilities accumulate fast. Without version control, review gates, metadata, and tests, a capability directory becomes a dumpster of prompts and scripts — hard to audit, easy to break, impossible to share.

Pi Kit makes capabilities auditable, testable, reviewable, and reversible:

- every active resource has a `resource.yaml` tracking source, risk, activation policy, and verification history;
- `registry.yaml` is generated from resource metadata — never hand-maintained;
- maintenance scripts enforce structural rules and risk scanning;
- `just test` is the single fast gate before every commit;
- third-party capabilities go through quarantine before activation.

## Active skills

| Skill | Risk | What it does |
| --- | --- | --- |
| `autodl` | High | AutoDL Pro GPU instance management, balance checks, SSH smoke tests |
| `code-taste` | Low | Code-level judgment for maintainability, API shape, tests, errors, performance |
| `doc-coauthoring` | Low | Structured workflow for co-authoring specs, RFCs, proposals, decision docs |
| `omp-superpowers` | Medium | Superpowers development methodology with fast path for simple tasks |
| `paper-diagram` | Medium | Publication-ready paper diagrams from image/text specs, SVG-first with PPTX fallback |
| `skill-authoring` | Low | Create, review, localize, and maintain Agent Skills |

## External references

Third-party source material lives under `references/` and is not active until reviewed and incorporated into a tracked skill, draft, tool, package, or documentation artifact.

| Collection | Status |
| --- | --- |
| `references/anthropic-skills` | Source material for third-party skills and PPTX tooling |
| `references/ppt-master` | SVG/PPTX diagram-generation reference material |
| `references/compound-engineering-plugin` | Engineering workflow, review persona, and converter reference material |
| `references/agents` | Marketplace-scale agent, skill, command, and adapter reference material |
| `references/harness` | Agent-team design reference; not active |
| `references/impeccable` | Frontend design reference; not active |

## Layout

```text
skills/          Active skills
extensions/      OMP extensions (reserved)
tools/           Deterministic CLIs/libraries (reserved)
packages/        Pi/OMP capability bundles (reserved)
references/      Local upstream source/reference material (gitignored)
drafts/          In-progress skills before promotion
mcp/             MCP servers and configs (reserved)
docs/            Project documentation
scripts/         Maintenance automation
tests/           Repository-level tests
```

## Quick commands

```bash
just install              # symlink each ./skills/* → ~/.agents/skills/
just install-force        # replace stale per-skill links or old ~/.agents/skills parent symlink

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
| `docs/workflows.md` | Daily operations, import/promote lifecycle, collection processing |
| `docs/pi-omp-runtime-notes.md` | Pi / OMP capability model reference |

## Rules

- `resource.yaml` is canonical; `registry.yaml` is generated. Do not edit `registry.yaml` by hand.
- Do not place unreviewed third-party skills in `skills/`.
- Do not commit caches, virtual environments, compiled files, secrets, tokens, SSH hosts, or private keys.
- After changing structure, scripts, metadata, or skills, run `just test`.
