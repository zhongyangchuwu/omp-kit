# OMP Kit

OMP Kit combines a model-neutral workflow for Oh My Pi (OMP) with a personally maintained Skill library and the design knowledge behind it. The repository is intended for people as well as agents: accepted decisions and compact supporting evidence travel with the code.

## What is included

- Four task-shaped agents: `luna-code`, `luna-deep`, `luna-doc`, and `sol-review`.
- Fifteen maintained Skills covering workflow, code taste, product design, debugging, research, testing, verification, language tooling, Skill authoring, specialized planning, AutoDL and document parsing.
- A Main-session workflow rule, bounded shared feedback, and a local session-evidence collector.
- Current usage documentation, mechanism-level design records, and compact experiment evidence.

Core workflow, maintained experience Skills, and service integrations are responsibility categories, not a ranking of value or a requirement to split repositories. Skills such as `code-taste` and `omp-design` preserve the maintainer's practical experience even when they are useful outside omp-kit. See [architecture](docs/architecture.md).

## Install from a checkout

Use an existing released OMP installation and Bun matching `package.json`:

```sh
git clone https://github.com/zhongyangchuwu/omp-kit.git
cd omp-kit
bun install --frozen-lockfile
omp plugin link .
omp plugin list
```

Restart the OMP session after changing installed resources. Linking a plugin does not configure your providers or replace `config.yml`, `models.yml`, or MCP settings. All maintained Skills remain in the existing native discovery path; service-specific Skills run only for their relevant requests and do not authorize cloud spending or document uploads by being installed.

```sh
omp plugin uninstall omp-kit
```

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

## Feedback and session evidence

`omp_kit_feedback` records bounded observations encountered during real work. Main and workers may report; recording feedback does not authorize repository, configuration, policy or Issue mutation. There is no mandatory end-of-task reflection.

OMP saves the raw sessions. Run the incremental collector after normal work, manually or through an operator-owned schedule:

```sh
bun run evidence:collect -- --folder /absolute/path/to/project
bun run evidence:report -- --folder /absolute/path/to/project
bun run evidence:report -- --folder /absolute/path/to/project --json
```

Collection is not a new model turn or an automatically installed daemon. Derived summaries stay outside Git. Selected material decision evidence may be committed under `evidence/experiments/`; full transcripts and raw telemetry do not belong there.

OMP 18.1.21 has claim-specific Main/worker feedback and collector runtime evidence. Folder filtering uses public trace `cwd` to handle the stats storage-key mismatch. Provider identity is sampled per track/model, not an exact request-routing ledger. See [session evidence](docs/session-evidence.md) and [validation](docs/VALIDATION.md) for limits.

## Maintenance

Python/uv remain necessary for the maintained Skill-library tooling and tests; Bun owns the TypeScript runtime/test surface. AutoDL retains its own dependency environment.

```sh
bun install --frozen-lockfile
just verify
```

CI runs the same provider-free gate on PR merge refs and on `main` after landing. It covers repository/native-plugin consistency, Skill support files, metadata/registry checks, AutoDL mocked tests, TypeScript typecheck/tests, changed-line hygiene and tracked-file drift. It does not run paid providers, cloud operations or live OMP acceptance scenarios.

Do not delete a maintained Skill, accepted design, or compact experiment simply because it is not needed for the smallest runtime. Remove confirmed obsolete material, or make a targeted correction supported by a concrete defect.

## Documentation

Start with the [documentation map](docs/README.md). It separates current usage, design rationale, evidence and maintenance. [WORKING_STATE](docs/WORKING_STATE.md) is only the current work index; Issues own unfinished problems and PRs own implementation/review. Closed Issues mean completed acceptance criteria, not merely deferred work.

`0.1.0` is the release candidate version. The package remains private; a green candidate is not a published release.
