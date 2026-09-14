# AutoDL Server Best Practices

This guide distills reusable AutoDL server lessons from the qwen remote workflow and run logs. It is project-neutral: keep project-specific sync, training, evaluation, and artifact commands in the target project. Provider/image observations below are evidence from that work, not a guarantee for every current image; inspect actual disk, API and job state.

## 1. Storage model

AutoDL work should distinguish two storage classes:

| Area | Typical path | Operational meaning |
| --- | --- | --- |
| Workspace/data area | `/root/autodl-tmp` | Intended location for repositories, datasets, caches, checkpoints and run artifacts; verify the actual backing disk and lifecycle before relying on retention. |
| System/root filesystem | `/` | Treat as disposable during release; do not keep the only copy of important artifacts here. |

Use `REMOTE_WORKDIR` under `/root/autodl-tmp/<project-name>` only after confirming this path is backed by the intended data disk.

A run log found a 4090-48G image where `/root/autodl-tmp` still landed on a 30G overlay. Verify disk reality before long jobs:

```bash
autodl ssh -- df -h / /root/autodl-tmp
autodl ssh -- nvidia-smi
```

If the workspace shares a small overlay with conda, `.venv`, model files, outputs and caches, disk becomes the primary operational risk.

## 2. Lifecycle: stop vs release

| Action | Data/workspace | System disk | Typical use |
| --- | --- | --- | --- |
| stop | retained under the service's current contract | retained | pause and continue later |
| release | verify actual retention; keep an independent copy of important data | cleared | longer idle period after artifacts are safe |

`create-pro starts billing immediately`: a successful Pro create was observed to enter `running` directly. Do not treat create as a free reservation.

Before release:

1. Verify status is `shutdown` or `stopped`.
2. Confirm important outputs are on verified retained storage or already pulled back.
3. Confirm no needed setup exists only on the system disk.
4. Preview `release-pro` and execute only after explicit approval.

The cost-control shorthand "power off before asking a blocking question" applies only when the user's shutdown policy authorizes it and the instance/job is owned by this task. Do not terminate unrelated jobs or infer stop authority from a pause in conversation.

## 3. Secrets and multi-instance control

Use `secrets.json` as the source of truth for multiple servers:

```text
shared          -> common AUTODL_TOKEN, SSH_KEY, API keys
servers.gpu0    -> AUTODL_PRO_INSTANCE_UUID, SSH_SERVER, SSH_PORT, REMOTE_WORKDIR
servers.gpu1    -> AUTODL_PRO_INSTANCE_UUID, SSH_SERVER, SSH_PORT, REMOTE_WORKDIR
images          -> named image placeholders or local private image IDs
```

Do not print real token, host, port, key path, instance/image UUID, `snapshot` passwords, Jupyter tokens or full SSH commands.

After start or create, use `snapshot` for fresh SSH details and update only `SSH_SERVER` and `SSH_PORT` for the selected server. Ports can change across lifecycle operations.

## 4. API surface and control-plane limits

Useful read-only checks:

```bash
autodl servers
autodl server-info
autodl balance
autodl list
autodl status
autodl snapshot
autodl gpu-stock --region-sign westDC2
autodl deployments
autodl containers --deployment-uuid <deployment-uuid>
```

Recorded API observations, to recheck when relevant contracts change:

- Developer API uses `Authorization: <developer-token>`, not `Bearer`.
- `balance` works with an empty JSON body.
- `status` and `snapshot` use `instance_uuid` in the query string in this client.
- Pro list/status/snapshot do not necessarily see ordinary console containers.
- Elastic deployment queries can require permissions or a deployment UUID.
- For detailed spend/order history, inspect the service's billing interface rather than inferring it from these status calls.

Resource API preview/confirmation does not apply automatically to all commands: SSH, sync and run commands can execute immediately. Use `--dry-run` for sync and supported redacted `--print-command` for SSH/run previews.

## 5. SSH readiness

API success does not prove SSH readiness. After starting or switching an instance, inspect the authorized target:

```bash
autodl --server gpu0 ssh -- hostname
autodl --server gpu0 ssh -- nvidia-smi
autodl --server gpu0 ssh -- df -h / /root/autodl-tmp
```

A closed connection can mean stopped/released compute, stale host/port, a different management plane, an unapplied key or an old local server alias. Refresh with `snapshot` and update only the selected SSH fields.

## 6. Remote environment setup

Project setup belongs to the project. Useful patterns include checking conda paths (`/root/miniconda3/bin`, `/root/anaconda3/bin`, `/opt/conda/bin`), using an authorized package installation method for missing uv/tmux, and uploading already-downloaded large models instead of repeated remote downloads.

Validate Python, uv, CUDA visibility, GPU name, driver and precision support before long work. Run a small smoke before full training/evaluation.

FlashAttention2 remains optional unless PyTorch, CUDA runtime/compiler and wheel availability are verified together. The qwen logs found SDPA a more reliable baseline for those images when FlashAttention2 failed on mismatches. This is a recorded environment lesson, not a universal benchmark.

## 7. Long-running jobs

Use `tmux or screen`, or a project logging wrapper, rather than tying training/evaluation to interactive SSH.

Useful project-run artifacts:

- stdout/stderr in `outputs/runs/<run_name>/logs/remote.log`;
- exit status in `logs/remote.log.status`;
- progress in `logs/progress.jsonl` when possible;
- `merged_config.yaml` and `run_context.json` when the project uses them;
- retained/pulled outputs before analysis.

Zero prediction rows plus only config/context files can indicate startup failure or a pre-generation stall. Inspect logs, status, progress and GPU utilization before relaunching. Do not start a duplicate without checking the old process.

## 8. Disk and cache hygiene

A qwen checkpoint failed with `No space left on device` when the small overlay filled with models, outputs, environments and `uv cache`.

```bash
autodl ssh -- df -h / /root/autodl-tmp
autodl ssh -- du -sh /root/.cache/uv || true
```

Review stale cache before cleaning, rotate checkpoints where appropriate, and delete failed outputs only after confirming ownership and retention needs. A larger disk can help when available; a directory name does not prove its capacity or persistence.

## 9. Smoke and artifact gates

Local config tests do not establish remote readiness:

1. Local config/data preflight.
2. Authorized SSH smoke: hostname, GPU and disk.
3. Remote environment and model/config availability.
4. Tiny project smoke that logs, writes expected artifacts and exits correctly.
5. Full run only after inspecting smoke artifacts.

For ML work, record the run name, server alias, sample count, batch/precision, timestamps, exit status, throughput/progress, artifact root and authorized final lifecycle state. Do not expose credentials in those records.

## 10. Cost control checklist

Before starting, inspect balance/status/stock, preview the resource change and obtain create/start/release approval. During work use logs and inspect disk before checkpoint-heavy tasks. After work preserve artifacts and follow the user's authorized stop/retention plan; release only when system-disk contents are disposable. Read back the final state.
