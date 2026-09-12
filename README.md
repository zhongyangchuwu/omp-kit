# OMP Kit

Personal Oh My Pi harness: runtime configuration, model routing, custom agents, maintained skills, and supporting automation.

The repository is the source of truth for portable OMP harness state. Runtime files under `~/.omp/agent/` are deployed from here rather than maintained independently by hand.

## Layout

```text
config/          Canonical OMP config.yml and models.yml (no secrets)
agents/          Custom OMP task agents
skills/          Active reusable skills
drafts/          In-progress skills before promotion
references/      Local upstream source/reference material (gitignored)
docs/            Harness architecture and project documentation
scripts/         Installation, validation, registry, and maintenance automation
schemas/         Resource metadata schema
tests/           Repository-level tests
registry.yaml    Generated skill/draft index
justfile         Common maintenance entry points
```

## Harness v2

Current design direction:

```text
Human
  -> Sol director / control plane
      -> Luna High routine workers
      -> Luna Max difficult bounded workers
      -> Sol High selective high-risk review
```

Key policies:

- expensive models make high-leverage decisions; inexpensive workers do token-heavy execution;
- workers retrieve repository and parent-conversation context themselves when appropriate;
- custom workers have deliberately small tool surfaces;
- persistent workers are reused per coherent workstream;
- high-effort workers use bounded repair and explicit stop conditions;
- durable planning artifacts are for state that must survive sessions, not for every large edit;
- tracked config is canonical, while credentials remain outside Git.

See `docs/HARNESS_V2_GUIDE.md` for the full rationale and `docs/HARNESS_V2_HANDOFF.md` for migration context.

## Install

Set the CLIProxyAPI bearer key outside Git:

```bash
export CLIPROXYAPI_API_KEY='...'
```

Then from the repository root:

```bash
just install
```

The installer:

- symlinks active skills into `~/.omp/agent/skills/`;
- symlinks tracked custom agents into `~/.omp/agent/agents/`;
- copies canonical `config/config.yml` to `~/.omp/agent/config.yml`;
- copies canonical `config/models.yml` to `~/.omp/agent/models.yml`.

If runtime config differs, installation refuses to overwrite it. Review the drift, then use:

```bash
just install-force
```

`install-force` creates timestamped backups before replacing differing config files. It still refuses to replace unmanaged real agent/skill files.

## Development commands

```bash
just install              # install complete harness; refuse config drift
just install-force        # backup and replace differing runtime config
just install-skills       # legacy skill-only linking path

just build-registry       # regenerate registry.yaml from resource.yaml files
just check-registry       # fail if registry.yaml is stale
just validate-registry    # validate registry and resource metadata
just build-index          # print compact registry index

just promote-skill drafts/NAME --name NAME
just test
```

## Configuration

`config/config.yml` currently routes the harness around two model classes:

- Luna for routine and difficult execution;
- Sol for the main director, planning, and high-risk review.

`config/models.yml` defines the local `cpa` provider through CLIProxyAPI's Codex-compatible endpoint and reads its bearer secret from `CLIPROXYAPI_API_KEY` at runtime. Sol and Terra entries route soft compaction to Luna via `compactionModel`.

The tracked configuration assumes CLIProxyAPI on `http://127.0.0.1:8317`. Change the tracked provider endpoint if the deployment intentionally differs; never commit its secret.

## Resource rules

- `resource.yaml` remains canonical metadata for maintained skills.
- `registry.yaml` is generated and must match resource metadata.
- Unreviewed third-party material stays under gitignored `references/` until extracted into maintained resources or docs.
- Project facts live in `docs/`; reusable procedure lives in the owning skill.
- Agent definitions live in `agents/`; model/runtime routing lives in `config/`.
- After changing scripts, metadata, configuration, agents, or skills, run `just test` and inspect the effective OMP configuration after installation.
