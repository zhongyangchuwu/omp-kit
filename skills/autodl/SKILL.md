---
name: autodl
description: Use when managing AutoDL Pro GPU instances, checking AutoDL balance or GPU stock, running AutoDL SSH smoke tests, or coordinating multiple AutoDL servers through secrets.json
---

# AutoDL

## Overview

Use this skill to operate AutoDL Pro instances safely across projects. The default control plane is a local `secrets.json` with named servers; every resource-changing command is dry-run unless explicitly confirmed.

For server setup, lifecycle, storage, logging, disk, and smoke-gate guidance, read **Server Best Practices** in `docs/server-best-practices.md` before starting paid or long-running work.

## First Checks

1. Locate the project `secrets.json`; never print its contents.
2. Identify the target server name, defaulting to `gpu0` only when project context does not specify another server.
3. Use read-only commands before resource changes: `servers`, `server-info`, `balance`, `status`, `gpu-stock`.
4. Keep project-specific sync/train/eval commands outside this skill; run them through `autodl ssh -- <project-command>` only after the project workflow is known.
5. For long-running jobs, confirm the project has a logging wrapper, `tmux`/`screen`, or equivalent durable execution path.

## Safety Red Lines

- Never expose `AUTODL_TOKEN`, real SSH host/port, private key path, Pro instance UUID, image UUID, password, Jupyter token, or full SSH command.
- Never run `create-pro`, `power-pro start`, or `release-pro` with `--confirm` unless the user explicitly approved that paid/destructive action.
- Always dry-run resource changes first.
- Before release, verify the instance is stopped and important project artifacts are on persistent storage.
- If waiting for user input while a paid instance is running, stop it first when safe and verify stopped status.

## Quick Commands

Run from a repository that contains `skills/autodl/`:

```bash
uv run --project skills/autodl autodl --secrets-file secrets.json servers
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 server-info
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 balance
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 status
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 gpu-stock --region-sign westDC2
```

Resource changes:

```bash
uv run --project skills/autodl autodl --server gpu0 create-pro --gpu-spec-uuid 5090-p --image-uuid <image-uuid>
uv run --project skills/autodl autodl --server gpu0 power-pro start
uv run --project skills/autodl autodl --server gpu0 power-pro stop
uv run --project skills/autodl autodl --server gpu0 release-pro --instance-uuid <pro-instance-uuid>
```

Real execution requires explicit flags:

```bash
uv run --project skills/autodl autodl --server gpu0 power-pro start --confirm --yes-i-have-user-confirmation --update-secrets-ssh
uv run --project skills/autodl autodl --server gpu0 power-pro stop --confirm
uv run --project skills/autodl autodl --server gpu0 release-pro --instance-uuid <pro-instance-uuid> --confirm --yes-i-have-user-confirmation
```

SSH smoke tests:

```bash
uv run --project skills/autodl autodl --server gpu0 ssh -- hostname
uv run --project skills/autodl autodl --server gpu0 ssh -- nvidia-smi
uv run --project skills/autodl autodl --server gpu0 ssh --print-command -- hostname
```

## Decision Guide

| Need | Command class | Notes |
| --- | --- | --- |
| Know configured targets | `servers`, `server-info` | Redacted local summaries only |
| Know account/resource state | `balance`, `list`, `status`, `snapshot`, `gpu-stock` | Read-only API calls |
| Start paid compute | `power-pro start` | Dry-run first; real start needs user confirmation flag |
| Stop compute | `power-pro stop` | Confirmed stop should be followed by `status` |
| Delete system disk | `release-pro` | Only after stopped-state and artifact checks |
| Run project command remotely | `ssh -- <cmd>` | Project owns the command; skill owns connection safety |
| Prepare long run | `ssh -- <project-smoke>` then project wrapper | Follow `docs/server-best-practices.md`: smoke, logs, progress, disk, artifacts |

## Configuration

Default file: `secrets.json`.
Default server: `gpu0`.
Precedence: CLI option > environment variable > `servers.<server>` > `shared` > safe default.

See `examples/secrets.example.json` for shape. Use placeholders in docs and chat; keep real values local and untracked.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Using `.env` as the primary config | Use `secrets.json`; `.env` is only compatibility glue if a project needs it |
| Starting without checking balance/status | Run read-only checks first |
| Treating `release` like `stop` | Release clears system disk; stop preserves it |
| Copying qwen-specific `just` commands to another project | Read that project's workflow and run only its own commands |
| Printing snapshot output raw | Always use the CLI redacted output |
| Running long work in an interactive SSH session | Use tmux or screen, or the project's logged remote-run wrapper |
| Ignoring disk before checkpoint-heavy jobs | Check `/` and `/root/autodl-tmp`; clean stale uv cache if needed |
