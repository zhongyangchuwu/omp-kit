# OMP Kit

OMP Kit combines a model-neutral workflow for Oh My Pi (OMP) with a personally maintained Skill library and the design knowledge behind it. The repository is intended for people as well as agents: accepted decisions and compact supporting evidence travel with the code.

## What is included

- Four task-shaped agents: `luna-code`, `luna-deep`, `luna-doc`, and `sol-review`.
- Fifteen maintained Skills covering workflow, code taste, product design, debugging, research, testing, verification, language tooling, Skill authoring, specialized planning, AutoDL and document parsing.
- A Main-session workflow rule, bounded shared feedback, local session evidence, and human-facing assurance.
- Current usage documentation, mechanism-level design records, and compact experiment evidence.

Core Harness resources, maintained experience Skills, and integrations are responsibility categories, not a ranking of value or a requirement to split repositories. Skills such as `code-taste` and `omp-design` preserve the maintainer's practical experience even when they are useful outside omp-kit. See [architecture](docs/architecture.md).

## Install for active development

For a checkout that stays on the latest development state, keep one long-lived clone and let OMP link that working tree through its native local install flow:

```sh
git clone git@github.com:zhongyangchuwu/omp-kit.git
cd omp-kit
just install
```

`just install` runs the frozen Bun install, `omp install .`, and `omp plugin list`. Current OMP routes a local install target to its native link flow, so the installed plugin points at this checkout instead of making a second development copy. Ordinary edits and `git pull` therefore keep the same plugin registration; restart OMP after changing resources, and rerun `just install` when dependencies or plugin registration change.

Useful maintenance commands:

```sh
just check-install   # show native plugin registration
just plugin-doctor   # run OMP's plugin-root health checks
just uninstall       # remove the omp-kit plugin registration
```

The repository may remain private for this workflow. A private remote Git install is also possible when the machine's Git/SSH credentials can access it, for example `omp install git@github.com:zhongyangchuwu/omp-kit.git`, but that is a managed installed copy rather than the editable working-tree link and is therefore not the preferred development path. Making the repository public is useful only when unauthenticated users should be able to install it directly.

Linking the plugin does not configure providers or replace `config.yml`, `models.yml`, or MCP settings. All maintained Skills remain in the existing native discovery path; service-specific Skills run only for their relevant requests and do not authorize cloud spending or document uploads by being installed.

The retired Harness v2 config-copy installer is no longer a supported install path. Existing machine files are not removed automatically. Read [installation and migration](docs/omp-installation.md) before changing a previously managed setup. A skill-only linking helper remains available for deliberate library use; do not duplicate native plugin discovery with it.

## Normal work

Main chooses direct execution, one bounded delegate, or independent parallel delegates according to the work. Delegation is not mandatory. Workers have scoped responsibilities; Main owns product decisions, integration and final acceptance.

For multi-session projects, the default is:

```text
actual repository state
-> current docs and accepted design
-> WORKING_STATE navigation
-> owning Issue and active PR
```

Accepted knowledge belongs in the checkout, not only in GitHub discussion. The specialized `.planning/` Skill remains available for deliberately selected phase/offline dossiers; it is not initialized merely because work spans sessions. See [workflows](docs/workflows.md) and [design foundations](docs/design-foundations.md).

## Feedback, evidence and assurance

`omp_kit_feedback` records bounded observations encountered during real work. Main and workers may report; recording feedback does not authorize repository, configuration, policy or Issue mutation. There is no mandatory end-of-task reflection.

OMP saves the raw sessions. Run the incremental collector after normal work, manually or through an operator-owned schedule:

```sh
bun run evidence:collect -- --folder /absolute/path/to/project
bun run evidence:report -- --folder /absolute/path/to/project
bun run evidence:report -- --folder /absolute/path/to/project --json
```

Collection is not a new model turn or an automatically installed daemon. Derived summaries stay outside Git. Selected material decision evidence may be committed under `evidence/experiments/`; full transcripts and raw telemetry do not belong there.

The assurance CLI derives bounded, evidence-linked review findings from OMP session evidence. It is a review snapshot, not a safety proof. See [session assurance](docs/session-assurance.md) and [scope](docs/assurance-scope.md).

See [session evidence](docs/session-evidence.md) and [validation](docs/VALIDATION.md) for current evidence limits.

## Maintenance

Python/uv remain necessary for retained repository/Skill-library helpers and tests; Bun owns the TypeScript runtime/test surface. AutoDL retains its own dependency environment.

```sh
bun install --frozen-lockfile
just verify
```

CI runs the same provider-free gate on PR merge refs and on `main` after landing. It covers repository/native-plugin consistency, Skill support files, AutoDL mocked tests, TypeScript typecheck/tests, changed-line hygiene and tracked-file drift. It does not run paid providers, cloud operations or live OMP acceptance scenarios.

Do not delete a maintained Skill, accepted design, or compact experiment simply because it is not needed for the smallest runtime. Remove confirmed obsolete material, or make a targeted correction supported by a concrete defect.

## Documentation

Start with the [documentation map](docs/README.md). It separates current usage, design rationale, evidence and maintenance. [WORKING_STATE](docs/WORKING_STATE.md) is only the current work index; Issues own unfinished problems and PRs own implementation/review. Closed Issues mean completed acceptance criteria, not merely deferred work.

`v0.1.0` is the first published baseline. Ongoing development follows `main`; the package remains private because omp-kit is distributed as an OMP plugin/source checkout rather than an npm package.
