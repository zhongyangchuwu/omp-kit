---
name: experiment-ops
description: Use when preparing, launching, monitoring, resuming, cancelling, or recovering research experiments and other long-running computational runs on local or remote machines; when checking whether an SSH/server target is ready; or when bootstrapping workspace-local experiment tooling such as uv, tmux, conda/mamba, pixi, or mise. Covers read-only target probing, workspace-local environment setup, smoke gates, durable execution, logs/artifacts, and run recovery. Does not own scientific experiment design or result interpretation.
---

# Experiment Ops

## Purpose

Operate already-defined experiments reliably. Treat execution infrastructure, project environment, run lifecycle, and evidence as separate concerns. Prefer the project's existing runner and environment model over inventing a second framework.

## Core rules

- Treat remote targets as read-only by default. A successful SSH or provider connection authorizes inspection, not installation, file sync, directory creation, permission changes, process launch, process termination, or host configuration changes.
- Before any remote mutation, confirm that the current task actually authorizes that class of change. Running an experiment authorizes normal project-scoped execution only when the request clearly implies it; it does not authorize arbitrary host changes.
- Keep generic experiment tooling in the selected workspace when practical. Do not modify system packages, system Python/CUDA, the base Conda environment, or shell startup files unless the user explicitly requests host-level configuration.
- Respect project-owned environment declarations and runners. Do not migrate a project to uv, Pixi, Conda, mise, W&B, MLflow, Slurm, or another framework merely to satisfy this skill.
- Do not silently downgrade a missing execution capability. If the chosen lane requires tmux, a scheduler, or another durable runner and it is missing, report or bootstrap that capability rather than quietly switching to a weaker mechanism.
- Run the narrowest useful smoke before a long-running or expensive run.
- Never entrust a run that may outlive the interaction, SSH connection, or agent tool lifecycle to a transient foreground shell.
- Process alive does not prove experiment success. Report observed state and evidence, not optimistic conclusions.
- Inspect existing processes, logs, and artifacts before retrying. Do not create duplicate runs just because output is delayed or a tool call returned unexpectedly.
- Preserve failed runs as facts. If a semantically relevant config, seed, input, or recovery parameter changes, use a new run identity.
- Keep process, compute, and storage/resource lifecycle separate. A completed process does not imply compute or paid storage has been released.

## Workflow

1. **Resolve target.** Identify the execution target, connection mechanism, workspace, project root, and execution lane. Reuse SSH aliases, provider configuration, scheduler metadata, and project docs rather than duplicating credentials.
2. **Probe read-only.** Inspect identity, workspace, permissions, disk, required tools, compute devices, existing jobs/processes, and project environment declarations. Read `references/targets.md` for target facts and probe discipline.
3. **Classify readiness.** Separate observed facts from desired configuration. Identify blockers for the selected execution lane.
4. **Plan bootstrap.** If infrastructure is missing, propose the smallest workspace-local change that satisfies the lane. Read `references/bootstrap.md` before installing or configuring tools.
5. **Cross the mutation gate.** Only perform bootstrap, sync, dependency installation, directory creation, or process launch when the user's request authorizes that scope. Keep host-level changes separate and explicit.
6. **Prepare project environment.** Reuse the project's existing package manager, lockfile, container, module system, or runner. Avoid mixing package managers over the same dependency domain without a clear owner.
7. **Smoke.** Execute a small representative run that proves startup, resources, logging, expected artifacts, and clean termination. Do not treat smoke metrics as research results.
8. **Launch durably.** Use the project-native runner, scheduler, provider runner, or tmux as appropriate. Read `references/execution.md` for backend selection, logging, run handles, and monitoring.
9. **Observe.** Inspect backend state, logs, resource use, and artifacts. State only what the evidence establishes.
10. **Finish or recover.** Collect artifacts and terminal evidence. For failures, duplicates, resume, relaunch, cancellation, and lifecycle handoff, read `references/recovery.md`.

## Execution lanes

Choose the lane from observed infrastructure and project conventions, not from preference alone:

| Lane | Durable owner | Typical use |
| --- | --- | --- |
| project-native | existing project runner or service | repository already has a reliable run wrapper |
| scheduler | Slurm, PBS, or site scheduler | managed cluster/HPC |
| provider | provider job/run system such as AutoDL run submit | cloud/provider-managed execution |
| unmanaged SSH | tmux by default | ordinary Linux server reached over SSH |
| local | foreground for cheap bounded work; durable runner when needed | workstation or local server |

When the target is AutoDL, compose with the `autodl` skill for provider-specific lifecycle, billing, secrets, and resource actions. Do not duplicate those policies here.

## Minimum run evidence

After a durable launch, retain enough information to rediscover the run. Reuse existing project/provider tracking when available; do not create a global registry just for this skill.

At minimum know:

- run identity;
- target/workspace;
- durable backend and backend identity;
- command or config source;
- log location;
- artifact/checkpoint location;
- how to inspect progress;
- how to stop or cancel intentionally.

## Reference routing

| Need | Read |
| --- | --- |
| Target identity, workspace, permissions, read-only probing, cached facts | `references/targets.md` |
| Workspace-local tools, env files, uv/tmux/Conda/Pixi/mise/micromamba choices | `references/bootstrap.md` |
| Smoke, durable launch, logs, run handles, monitoring | `references/execution.md` |
| Failure diagnosis, duplicate prevention, resume/relaunch, cancellation, final collection | `references/recovery.md` |
