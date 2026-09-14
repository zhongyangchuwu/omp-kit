---
name: autodl
description: Use when managing AutoDL Pro GPU instances, checking AutoDL balance or GPU stock, running AutoDL SSH smoke tests, or coordinating multiple AutoDL servers through secrets.json
---

# AutoDL

## Overview

Use this skill to operate AutoDL Pro instances safely across projects. The control plane is a local `secrets.json` with named servers. Resource API mutations (`create-pro`, `power-pro`, `release-pro`) preview unless explicitly confirmed. **SSH, sync and run commands have different defaults and can execute immediately**; inspect the command class before use.

For server setup, lifecycle, storage, logging, disk, and smoke-gate guidance, read **Server Best Practices** in `docs/server-best-practices.md` before starting paid or long-running work.

## First Checks

1. Locate the project `secrets.json`; never print its contents.
2. Identify the target server name, defaulting to `gpu0` only when project context does not specify another server.
3. Use read-only commands before resource changes: `servers`, `server-info`, `balance`, `status`, `gpu-stock`.
4. Run `check` before a sync or long-running job to confirm local rsync, remote workdir, tmux, GPU, and disk readiness.
5. Keep project-specific workflow outside this skill except for connection-safe wrappers: use `sync up`, `ssh -- <project-command>`, and `run submit/status/tail/kill` for the project's own remote loop.
6. For long-running jobs, prefer `run submit` when the project has a logged run archive; use `ssh -- <project-smoke>` for interactive debug and one-off inspection.

## Safety Red Lines

- Never expose `AUTODL_TOKEN`, real SSH host/port, private key path, Pro instance UUID, image UUID, password, Jupyter token, or full SSH command.
- Never run `create-pro`, `power-pro start`, or `release-pro` with `--confirm` unless the user explicitly approved that paid/destructive action.
- Dry-run resource changes first. Use `--dry-run` for sync previews or the redacted `--print-command` for supported SSH/run previews; do not assume these commands inherit the resource API confirmation gate.
- Before release, verify the instance is stopped and important project artifacts are on persistent storage.
- Stop an idle paid instance only within the user's shutdown authorization and after checking job/resource ownership. Waiting for user input is not permission to terminate unrelated work. Verify stopped status after an authorized stop.

## Quick Commands

Run from a repository that contains `skills/autodl/`:

```bash
uv run --project skills/autodl autodl --secrets-file secrets.json servers
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 server-info
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 balance
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 status
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 gpu-stock --region-sign westDC2
```

Resource API previews:

```bash
uv run --project skills/autodl autodl --server gpu0 create-pro --gpu-spec-uuid 5090-p --image-uuid <image-uuid>
uv run --project skills/autodl autodl --server gpu0 power-pro start
uv run --project skills/autodl autodl --server gpu0 power-pro stop
uv run --project skills/autodl autodl --server gpu0 release-pro --instance-uuid <pro-instance-uuid>
```

Authorized resource API execution:

```bash
uv run --project skills/autodl autodl --server gpu0 power-pro start --confirm --yes-i-have-user-confirmation --update-secrets-ssh
uv run --project skills/autodl autodl --server gpu0 power-pro stop --confirm
uv run --project skills/autodl autodl --server gpu0 release-pro --instance-uuid <pro-instance-uuid> --confirm --yes-i-have-user-confirmation
```

SSH smoke commands execute immediately unless `--print-command` is supplied:

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
| Start paid compute | `power-pro start` | Preview first; real start needs user confirmation flags |
| Stop compute | `power-pro stop` | Authorized confirmed stop, then read back status |
| Delete system disk | `release-pro` | Only after stopped-state and artifact checks |
| Run project command remotely | `ssh -- <cmd>` | Executes by default; project owns command consequences |
| Transfer files | `sync up`, `sync down-run` | Executes by default; preview with `--dry-run`; review delete/overwrite scope |
| Submit or kill a run | `run submit`, `run kill` | Executes by default; require task/resource authority |
| Prepare long run | project smoke then logged wrapper | Check logs, progress, disk and artifacts |

## Configuration

Default file: `secrets.json`. Default server: `gpu0`.
Precedence: CLI option > environment variable > `servers.<server>` > `shared` > safe default.

See `examples/secrets.example.json` for shape. Use placeholders in docs and chat; keep real values local and untracked.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Using `.env` as the primary config | Use `secrets.json`; `.env` is compatibility glue only |
| Starting without balance/status checks | Run read-only checks first |
| Treating release like stop | Release clears system disk; stop preserves it |
| Assuming every command is a dry-run | Distinguish resource APIs from SSH/sync/run execution |
| Copying another project's commands | Read the target project's workflow |
| Printing snapshot output raw | Use CLI redacted output |
| Running long work in interactive SSH | Use tmux/screen or the project's logged wrapper |
| Ignoring disk before checkpoint-heavy jobs | Check relevant filesystems and review cleanup scope |
