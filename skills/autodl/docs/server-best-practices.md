# AutoDL Server Best Practices

This guide distills reusable AutoDL server lessons from the qwen remote workflow and run logs. It is project-neutral: keep project-specific sync, training, evaluation, and artifact commands in the target project. Provider/image observations below are evidence from that work, not a guarantee for every current image; inspect actual disk, API and job state.

## 1. AutoDL Pro storage model

AutoDL Pro currently has **one system disk and no separate data disk**. Official Pro documentation says the system disk defaults to 30GB, may be expanded, and both the default and expanded capacity are billed by day. Powering the instance off retains that disk; it does not turn retained Pro storage into free storage.

`/root/autodl-tmp` is still the preferred project workspace path for compatibility with AutoDL workflows, but on Pro it is a directory on the retained system-disk lifecycle rather than proof of a separate free data disk. AutoDL documents that this directory is preserved by default across reset/image replacement; release is different and clears the instance disk.

Use:

```text
/root/autodl-tmp/<project-name>
```

for project work only after checking actual capacity and deciding how artifacts will survive instance release.

Verify disk reality before long jobs:

```bash
autodl ssh -- df -h / /root/autodl-tmp
autodl ssh -- nvidia-smi
```

A prior run found a 4090-48G image where `/root/autodl-tmp` shared the small system overlay. If repositories, environments, model files, caches, checkpoints and outputs share one Pro system disk, disk pressure becomes an operational and billing concern.

Provider contract references, checked 2026-09-19:

- [AutoDL Pro data and disk lifecycle](https://www.autodl.com/docs/instance_pro_data/)
- [AutoDL Pro overview](https://www.autodl.com/docs/instance_pro/)
- [AutoDL pricing](https://www.autodl.com/docs/price/)
- [AutoDL Pro API lifecycle](https://www.autodl.com/docs/instance_pro_api/)

Re-check provider documentation when billing or retention semantics matter; prices and product details can change.

## 2. Lifecycle and billing: stop vs release

For **pay-as-you-go Pro compute**, power-off ends compute/GPU time billing, but it does **not** mean the instance has zero ongoing cost. The retained Pro system disk is a separate daily charge.

For prepaid/package billing, the prepaid rental period continues regardless of power state; do not promise savings from shutdown alone.

| Action | Compute | Pro system disk | Data consequence | Typical use |
| --- | --- | --- | --- | --- |
| stop | pay-as-you-go compute stops | **continues daily billing while retained** | disk retained | short pause / continue later |
| release | compute already stopped | retained-instance disk billing ends | system-disk contents are destroyed | long idle period after artifacts are safe |

Important consequences:

- **Power off is a compute-cost action, not a zero-cost action.**
- AutoDL Pro's default system-disk capacity is paid storage according to current official documentation; expanded capacity is paid as well.
- Pro system-disk expansion currently cannot be directly shrunk; official docs suggest recreating/cloning when a smaller disk is needed.
- A stopped Pro instance retains data and can therefore continue producing a daily storage charge until release.
- Release is destructive. Copy important code, checkpoints, results and environment information somewhere that survives release before executing it.

`create-pro` can enter `running` immediately, so creation can start compute billing. Do not treat create as a free reservation.

Before release:

1. Verify status is `shutdown` or `stopped`.
2. Confirm important outputs/checkpoints have been pulled back or copied to storage that survives release.
3. Confirm no required environment/setup exists only on the Pro system disk.
4. Inspect the provider billing/instance page when cost is the reason for release; do not infer current charges from power state alone.
5. Preview `release-pro` and execute only after explicit approval.
6. Read back instance state after release.

The shorthand "power off before asking a blocking question" applies only when shutdown is authorized and useful for stopping pay-as-you-go compute. It does **not** mean ongoing Pro storage cost has stopped. Do not terminate unrelated jobs or infer stop/release authority from a pause in conversation.

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

Before starting, inspect balance/status/stock, preview the resource change and obtain create/start/release approval. During work use logs and inspect disk before checkpoint-heavy tasks. After work preserve artifacts and distinguish **compute shutdown** from **storage-cost termination**: `power-pro stop` can stop pay-as-you-go compute while Pro system-disk daily billing continues. Release only when system-disk contents are disposable and release is explicitly authorized. Read back final instance state and use the provider billing interface for cost confirmation.
