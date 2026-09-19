# Experiment Execution

Use this reference after target readiness is established.

## Backend selection

Prefer, in order:

1. reliable project-native run wrapper;
2. site scheduler for scheduler-managed clusters;
3. provider run/job system;
4. tmux for unmanaged SSH Linux;
5. another explicit durable mechanism only when its tradeoffs are understood.

Do not reconstruct a long command from fragments when the repository already owns a tested entrypoint.

## Foreground vs durable

Foreground execution is acceptable for cheap, bounded work whose loss/retry cost is small, including many probes and smoke runs. Use durable execution when the run may outlive the interaction, SSH connection, terminal, or tool call, or when losing it would be materially expensive. Do not use a fixed minute threshold.

## Smoke gate

Before a long or expensive full run, execute the narrowest representative smoke: a few training batches, one evaluation case/checkpoint, a few simulation episodes, or a small data shard.

Verify as applicable:

- command and imports start correctly;
- required devices/resources and inputs work;
- logs appear;
- expected output/checkpoint shape appears;
- the smoke terminates with an observed status.

Smoke proves execution readiness, not scientific validity or final performance.

## Durable launch

For unmanaged SSH, launch through a wrapper that preserves the project command's terminal status rather than relying on tmux disappearance or the exit status of `tee` alone. A minimal Bash pattern is:

```bash
tmux new-session -d -s <run-name> \
  "bash -lc 'set -o pipefail; <project command> 2>&1 | tee <run-log>; rc=\${PIPESTATUS[0]}; printf \"%s\\n\" \"\$rc\" > <run-status>; exit \"\$rc\"'"
```

Quote the actual project command safely, or prefer a tested project-owned wrapper when the command is complex. The durable record must retain the project command's terminal status. Use project-appropriate environment setup and a distinctive session name such as `<project>-<experiment>-<seed>`. Scheduler/provider jobs should use native job identities and logs rather than unnecessary tmux wrappers.

## Minimum observability

Reuse W&B, MLflow, TensorBoard, Hydra outputs, scheduler/provider state, or project run archives when already present. Do not create a second tracking database.

Even without a tracker, make these rediscoverable:

```text
run identity
target/workspace
backend and backend identity
command/config source
log path
terminal status/evidence path
artifact/checkpoint path
inspect/status command
intentional stop/cancel command
```

## Monitoring and multiple runs

Use backend state plus experiment evidence. `tmux session exists + log reached step 8200` supports "active through step 8200"; it does not support "will finish successfully". Completed status requires terminal evidence plus the expected result/artifact contract.

For multiple seeds/arms, keep run identities and mutable output directories separate, respect device allocation, and prefer existing scheduler/project batch mechanisms.
