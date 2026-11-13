# OMP Kit

OMP Kit combines a model-neutral workflow for Oh My Pi (OMP) with a personally maintained Skill library and the design knowledge behind it. The repository is intended for people as well as agents: accepted decisions and compact supporting evidence travel with the code.

## What is included

- Four task-shaped agents: `luna-code`, `luna-deep`, `luna-doc`, and `sol-review`.
- Maintained Skills covering workflow, code taste, product design, debugging, research, testing, verification, language tooling, Skill authoring, experiment operations, document parsing and project documentation.
- A Main-session workflow rule and other OMP-native definitions.
- Current usage documentation, mechanism-level design records, and compact experiment evidence.

Core Harness resources, maintained experience Skills, and integrations are responsibility categories, not a ranking of value or a requirement to split repositories. Skills such as `code-taste` and `omp-design` preserve the maintainer's practical experience even when they are useful outside omp-kit. See [architecture](docs/architecture.md).

## Install for active development

For a checkout that stays on the latest development state, keep one long-lived clone and let OMP link that working tree through its native local install flow:

Repository tooling is pinned to Bun 1.4.4, including Bun types; CI uses the same version. The last pre-retirement OMP runtime review used CLI 18.20.0 and Bun 1.4.4 on 2026-11-13. That review is historical, not a current OMP SDK/stats dependency or compatibility target; see [compatibility history](docs/omp-compatibility.md).

```sh
git clone git@github.com:zhongyangchuwu/omp-kit.git
cd omp-kit
just install
```

`just install` runs the frozen Bun install, `omp install .`, and `omp plugin list`. Current OMP routes a local install target to its native link flow, so the installed plugin points at this checkout instead of making a second development copy. Ordinary edits and `git pull` therefore keep the same plugin registration. New or installed Skills can be discovered in the running session; restart affected sessions for other loaded resource changes, and rerun `just install` when dependencies or plugin registration change.

Useful maintenance commands:

```sh
just check-install   # show native plugin registration
just plugin-doctor   # run OMP's plugin-root health checks
just uninstall       # remove the omp-kit plugin registration
```

The repository may remain private for this workflow. A private remote Git install is also possible when the machine's Git/SSH credentials can access it, for example `omp install git@github.com:zhongyangchuwu/omp-kit.git`, but that is a managed installed copy rather than the editable working-tree link and is therefore not the preferred development path. Making the repository public is useful only when unauthenticated users should be able to install it directly.

Linking the plugin does not configure providers or replace `config.yml`, `models.yml`, or MCP settings. All maintained Skills remain in the existing native discovery path; service-specific Skills run only for their relevant requests and do not authorize cloud spending or document uploads by being installed.

The retired Harness v2 config-copy installer is no longer a supported install path. Existing machine files are not removed automatically. Read [installation and migration](docs/omp-installation.md) before changing a previously managed setup.

## Normal work

Main chooses direct execution, one bounded delegate, or independent parallel delegates according to the work. Delegation is not mandatory. Workers have scoped responsibilities; Main owns product decisions, integration and final acceptance.

For multi-session projects, recover only the context the current task needs:

```text
current user/task intent
-> actual repository/runtime state
-> owning Issue and active PR when one exists
-> relevant current docs and accepted design
```

Projects may be only partially planned. Do not reconstruct a complete backlog, maintain a global work-state mirror, or create a parallel phase dossier merely so an agent can start. Accepted knowledge belongs in the checkout, not only in GitHub discussion; unresolved task coordination belongs in task-local Issues/PRs when useful. See [workflows](docs/workflows.md) and [design foundations](docs/design-foundations.md).

## Session data

OMP owns native session storage, history and usage stats. omp-kit no longer ships a feedback tool, session collector or session-access library; OMP's native session and stats facilities are not an equivalent to the retired feedback analysis.

Keep raw sessions and routine usage data in OMP's stores. Commit only selected material decision evidence under `evidence/experiments/`.

See [runtime notes](docs/omp-runtime-notes.md) for current OMP boundaries and [validation](docs/VALIDATION.md) for historical checks.

## Maintenance

The root repository uses Bun/TypeScript for tests and type-checking. Additional toolchains belong only to concrete maintained consumers.

```sh
bun install --frozen-lockfile
just verify
```

CI runs the same provider-free gate on PR merge refs and on `main` after landing. It covers repository/native-plugin consistency, Skill support files, TypeScript typecheck/tests, changed-line hygiene and tracked-file drift. It does not run paid providers, cloud operations or live OMP acceptance scenarios.

Do not delete a maintained Skill, accepted design, or compact experiment simply because it is not needed for the smallest runtime. Remove confirmed obsolete material, or make a targeted correction supported by a concrete defect or maintainer decision.

## Documentation

Start with the [documentation map](docs/README.md). It separates current usage, design rationale, evidence and maintenance. Issues own concrete unfinished problems when they are used; PRs own implementation/review. No repository-wide work-state mirror is required. Closed Issues mean completed acceptance criteria, not merely deferred work.

`v0.1.0` is the first published baseline. Ongoing development follows `main`; the package remains private because omp-kit is distributed as an OMP plugin/source checkout rather than an npm package.
