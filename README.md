# OMP Kit

OMP Kit is a personal, model-neutral workflow layer for [Oh My Pi (OMP)](https://github.com/can1357/oh-my-pi). The v0.1.0 baseline combines task-shaped agents, reusable workflow skills, issue-centered project state, structured qualitative feedback, and compact session evidence while leaving session/runtime mechanics to OMP.

## What v0.1.0 provides

```text
OMP runtime
  -> model-neutral task agents
  -> Main-session workflow policy and reusable skills
  -> issue-centered project-state conventions
  -> shared structured feedback for observed reusable friction
  -> compact local session-evidence collection/reporting
```

The product deliberately does **not** include a second agent scheduler, SessionManager, raw-session parser, trace database, model router, cloud telemetry service, or automatic self-modification loop.

Current released-runtime acceptance is based on **OMP 18.1.21**:

- Main and a normal `luna-code` worker can record `omp_kit_feedback` and exit normally;
- feedback keeps supported session/file provenance and remains evidence only;
- the session-evidence collector summarizes ordinary saved sessions, correlates Main/worker feedback, and leaves source transcripts unchanged;
- normal filesystem-path filtering works despite an OMP 18.1.21 stats folder/cwd inconsistency tracked upstream as `can1357/oh-my-pi#12060`.

These are claim-specific runtime checks, not a statement that every OMP 18.1.21 surface has been exhaustively tested.

## Native plugin path

From a clone of this repository:

```sh
omp plugin link .
omp plugin list
```

The plugin package exposes:

- model-neutral `luna-code`, `luna-deep`, `luna-doc`, and `sol-review` agents;
- maintained active skills;
- the Main-session workflow rule;
- the `omp_kit_feedback` extension.

Agents do not embed a required provider/model assignment. Use OMP's normal model configuration and per-agent overrides, or let task agents inherit the active session model.

To remove the linked checkout:

```sh
omp plugin uninstall omp-kit
```

The native plugin path does not install CPA, copy `config.yml`/`models.yml`, or replace ordinary OMP preferences.

## Project-state workflow

For repositories using the issue-centered workflow, ordinary work starts from actual repository state rather than hidden conversation memory:

```text
actual branch / HEAD / worktree
-> docs/WORKING_STATE.md
-> owning open Issue / active PR
-> only the design/workflow references needed for the task
```

`WORKING_STATE.md` is intentionally a short navigation index. Detailed unresolved work belongs in Issues, implementation/review/CI in PRs, accepted rationale in current design docs, and chronology in Issue/PR history.

Issue state semantics are simple:

```text
open + active   = unfinished and currently being worked/dogfooded
open + inactive = unfinished but waiting on a trigger/evidence/dependency
closed          = acceptance criteria complete
```

`.planning/` remains available as an explicit specialized/offline phase-dossier mode; it is not the default merely because work spans multiple sessions.

## Structured feedback

`omp_kit_feedback` is a bounded evidence sink available to Main and task agents when the extension is loaded.

```text
feedback
!= authorization
!= repository mutation
!= Issue mutation
!= policy promotion
!= automatic self-modification
```

A worker may record reusable friction it directly observed. Later human/Main/project triage decides whether that evidence warrants an Issue, design change, or no action.

OMP 18.1.21 does not expose first-class caller-agent identity in the public extension context, so v0.1.0 records supported session/file provenance rather than guessing the caller. The session-evidence collector can later correlate those files with OMP trace tracks.

## Session evidence

OMP remains the raw recorder. OMP Kit derives compact summaries outside Git:

```text
OMP saved sessions + stats/trace
-> omp-kit evidence collection
-> local compact summaries
-> aggregate reports for later #5/#8/#9 analysis
```

From the repository:

```sh
bun run evidence:collect
bun run evidence:report
```

Useful filters:

```sh
bun run evidence:collect -- --folder /path/to/project --since 2026-09-01T00:00:00Z
bun run evidence:report  -- --folder /path/to/project --since 2026-09-01T00:00:00Z
bun run evidence:report  -- --json
```

When the package bin is exposed by the package manager, the equivalent CLI is:

```sh
omp-kit-evidence collect
omp-kit-evidence report
```

The v1 evidence schema includes session/project identity, request/token/cost-equivalent activity, sampled provider provenance, tools/errors/durations, Main/subagent/advisor tracks, timing, and linked structured feedback. Provider identity is sampled rather than an exact per-request provider-routing ledger; see [`docs/session-evidence.md`](docs/session-evidence.md) for the precise contract and limits.

## Legacy/compatibility installer

The existing Python installer remains available for Harness v2 migration and machines that intentionally want the managed configuration snapshot. It requires **OMP and uv on PATH** and does not provision subscriptions, deploy CPA, transfer OAuth databases, install browsers/LSPs, or authenticate GitHub.

Linux / macOS / WSL:

```sh
bash install.sh --dry-run
bash install.sh
```

Native Windows:

```powershell
.\install.ps1 --dry-run
.\install.ps1
```

The portable entry point is also available directly:

```sh
uv run --script /path/to/omp-kit/scripts/install_harness.py
```

The native default agent root is normally `~/.omp/agent`. For a named OMP profile:

```sh
bash install.sh --omp-profile harness-v2-test --dry-run
bash install.sh --omp-profile harness-v2-test
omp --profile harness-v2-test
```

For recovery and machine-specific overlays:

```sh
bash install.sh --config-profile headless
bash install.sh --doctor
bash install.sh --rollback
```

The legacy installer backs up replaced managed objects, refuses unknown collisions/local edits by default, and does not sweep unrelated files. Secrets belong in the environment or selected agent-root `.env`, never in Git.

See [`docs/omp-installation.md`](docs/omp-installation.md) for the full compatibility contract.

## Repository layout

```text
agents/          model-neutral custom task agents
skills/          maintained workflow/tool skills
rules/           Main-session workflow entry point
extensions/      OMP extensions such as structured feedback
scripts/         session evidence, legacy installer, maintenance tools
config/          legacy managed settings/profiles and references
docs/            current architecture/workflow/design/validation docs
evidence/        selected durable experiment/decision snapshots
tests/           repository, plugin-contract, evidence and installer tests
```

## Development and verification

Start with [`docs/WORKING_STATE.md`](docs/WORKING_STATE.md) and the owning Issue/PR, then use [`docs/README.md`](docs/README.md) as the documentation map.

The routine deterministic repository gate is:

```sh
just verify
```

GitHub Actions is the normal full acceptance location for CI-supported changes: one PR merge-ref gate before landing and one `main` push gate after an authorized merge. Local full-gate repetition is optional unless it answers a distinct question.

Other maintenance commands include:

```sh
just install
just validate-harness
just doctor
just build-registry
just check-registry
just validate-registry
just test
```

Passing repository CI does not establish provider connectivity or machine-specific OMP behavior. Runtime claims still require the relevant released-runtime smoke.

## Release status

`0.1.0` is the first usable baseline intended for measured dogfood. The next phase is not feature accumulation: #5/#8/#11 collect real capability/delegation/project-state experience, #9 waits for enough evidence to perform systematic Harness subtraction, and #12 remains the promotion/retention lifecycle for material experiment evidence.
