# AutoDL Server Best Practices

This guide distills reusable AutoDL server lessons from the qwen remote workflow and run logs. It is project-neutral: keep project-specific sync, training, evaluation, and artifact commands in the target project.

## 1. Storage model

AutoDL work should assume two storage classes:

| Area | Typical path | Operational meaning |
| --- | --- | --- |
| Persistent workspace/data area | `/root/autodl-tmp` | Put repositories, datasets, model caches, checkpoints, and run artifacts here. It is the safest default for content needed after lifecycle operations. |
| System/root filesystem | `/` | Treat as disposable. Do not rely on it for important artifacts. |

Use `REMOTE_WORKDIR` under `/root/autodl-tmp/<project-name>` unless the image proves this path is not backed by the intended data disk.

A run log found a 4090-48G image where `/root/autodl-tmp` still landed on a 30G overlay. Therefore verify disk reality before long jobs:

```bash
autodl ssh -- df -h / /root/autodl-tmp
autodl ssh -- nvidia-smi
```

If the workspace shares a small overlay with conda, `.venv`, model files, outputs, and caches, disk becomes the primary operational risk.

## 2. Lifecycle: stop vs release

Use this distinction consistently:

| Action | Data/workspace | System disk | Typical use |
| --- | --- | --- | --- |
| stop | kept | kept | short pause; continuing soon |
| release | data area usually kept, system disk cleared | cleared | longer idle period or cost reduction after artifacts are safe |

`create-pro starts billing immediately`: a successful Pro create has been observed to enter `running` directly. Do not treat create as a free reservation.

Before release:

1. Verify status is `shutdown` or `stopped`.
2. Confirm important outputs are under `/root/autodl-tmp` or already pulled back.
3. Confirm no needed setup exists only on the system disk.
4. Dry-run `release-pro` before confirmed execution.

If a paid instance is running and you need to ask a blocking question, power off before asking a blocking question unless the user explicitly wants it kept alive.

## 3. Secrets and multi-instance control

Use `secrets.json` as the single source of truth for multiple servers:

```text
shared          -> common AUTODL_TOKEN, SSH_KEY, API keys
servers.gpu0    -> AUTODL_PRO_INSTANCE_UUID, SSH_SERVER, SSH_PORT, REMOTE_WORKDIR
servers.gpu1    -> AUTODL_PRO_INSTANCE_UUID, SSH_SERVER, SSH_PORT, REMOTE_WORKDIR
images          -> named image UUID placeholders or local private image IDs
```

Do not print real values for token, host, port, key path, instance UUID, image UUID, `snapshot` passwords, Jupyter tokens, or full SSH commands.

After start or create, use `snapshot` to retrieve fresh SSH details, then update only `SSH_SERVER` and `SSH_PORT` for the selected server. SSH ports can change across lifecycle operations.

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

Known API facts:

- AutoDL Developer API uses `Authorization: <developer-token>`, not `Bearer`.
- `balance` works with an empty JSON body.
- `status` and `snapshot` are safest with `instance_uuid` in the query string.
- Pro `list/status/snapshot` do not necessarily see ordinary console containers.
- Elastic deployment queries may require permissions or a deployment UUID.
- The public API does not provide reliable detailed spend history; use the website for order/billing detail.

## 5. SSH readiness

SSH validates a different layer than the API. API success does not prove SSH readiness.

Minimum smoke sequence after starting or switching instances:

```bash
autodl --server gpu0 ssh -- hostname
autodl --server gpu0 ssh -- nvidia-smi
autodl --server gpu0 ssh -- df -h / /root/autodl-tmp
```

If SSH reports a closed connection, common causes are:

- the instance is stopped or released;
- `SSH_SERVER` or `SSH_PORT` is stale;
- the target belongs to a different AutoDL management plane;
- the configured public key has not been applied to the current instance;
- the local `secrets.json` points to an old server alias.

Refresh with `snapshot` and update `SSH_SERVER` / `SSH_PORT` only.

## 6. Remote environment setup

Project setup belongs to the project, but these AutoDL patterns are broadly reusable:

- Add common conda paths when debugging manually: `/root/miniconda3/bin`, `/root/anaconda3/bin`, `/opt/conda/bin`.
- Install `uv` through conda or pip if the image lacks it.
- Install `tmux` through apt or conda if long jobs are needed.
- Prefer uploading already-downloaded large model directories over repeatedly downloading from external hubs.
- Validate Python, `uv`, CUDA visibility, GPU name, driver, and BF16 support before long runs.
- Run a small smoke before full training/evaluation.

FlashAttention2 should be optional unless the image's PyTorch, CUDA runtime, CUDA compiler, and wheel availability are verified together. The qwen run logs repeatedly found SDPA to be the stable default while FlashAttention2 failed on CUDA/PyTorch/compiler mismatches. Prefer SDPA as the safe baseline.

## 7. Long-running jobs

Use `tmux or screen`, or a project logging wrapper, for long commands. Do not bind long training/evaluation runs to an interactive SSH session.

Best practice for project run wrappers:

- capture stdout/stderr into `outputs/runs/<run_name>/logs/remote.log`;
- write exit status to `logs/remote.log.status`;
- emit progress to `logs/progress.jsonl` when possible;
- keep `merged_config.yaml` and `run_context.json` with the run;
- pull artifacts back before analysis.

If a run appears stuck or failed early:

- `0` prediction rows plus only config/context files usually means startup failure or pre-generation stall;
- inspect `remote.log`, `remote.log.status`, progress files, and GPU utilization before relaunching;
- do not blindly restart without checking whether the old process is still running.

## 8. Disk and cache hygiene

Disk failures can look like model or training failures. A qwen run failed at checkpoint save with `No space left on device`; root cause was a small overlay filled by model files, outputs, `.venv`, conda, and a large `uv cache`.

Before long jobs:

```bash
autodl ssh -- df -h / /root/autodl-tmp
autodl ssh -- du -sh /root/.cache/uv || true
```

Operational rules:

- Clean stale `uv cache` after dependency work if disk is tight.
- Use checkpoint rotation, for example a low `save_total_limit`, for checkpoint-heavy training.
- Delete failed partial run directories only after confirming artifacts are not needed.
- Consider mounting larger data disks for multi-epoch or checkpoint-heavy workloads if the image exposes them.

## 9. Smoke gates and artifact gates

Never treat local config tests as a substitute for remote smoke. A reliable sequence is:

1. Local tests or config/data preflight.
2. Remote SSH smoke: `hostname`, `nvidia-smi`, disk check.
3. Remote environment validation: Python, package manager, CUDA, model/config availability.
4. Tiny project smoke that starts, writes logs, writes artifacts, and exits zero.
5. Full run only after smoke artifacts are validated.

For ML workloads, record at least:

- run name;
- GPU/server alias;
- data rows or sample count;
- batch size and precision;
- start/end timestamps;
- exit status;
- throughput or progress counters;
- artifact root;
- final stop/shutdown status.

## 10. Cost control checklist

Before starting:

- `balance`
- `status`
- `gpu-stock` if creating
- dry-run the resource change
- explicit approval for confirmed create/start/release

During work:

- use logged long-running commands;
- monitor progress through logs/progress files;
- check disk before checkpoint-heavy jobs.

After work:

- pull or verify important artifacts;
- stop the instance if continuing soon;
- release only when system disk contents are disposable;
- verify final status is `shutdown` / `stopped` or released as intended.
