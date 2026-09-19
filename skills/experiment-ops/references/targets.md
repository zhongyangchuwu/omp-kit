# Targets and Read-Only Probing

Use this reference when connecting to an execution target or deciding whether it is ready.

## Target facts

Keep desired use separate from observed state:

- **TargetSpec**: target/SSH alias or provider target, absolute workspace, execution lane, known constraints.
- **TargetProbe**: what is actually observed now.

Connection credentials stay in SSH/provider configuration. Do not copy passwords, keys, or tokens into experiment metadata. Treat cached disk/tool/job facts as hints and re-probe volatile state before a run or mutation.

## Default authority

Remote targets are read-only by default. A connection permits narrow observation relevant to the experiment. It does not by itself authorize package installation, sync/upload, directory creation, permission changes, shell-profile edits, process launch/termination, or paid resource actions.

Classify planned actions as:

```text
observe
  read current state

project write
  authorized changes inside the project/workspace or requested run launch

host/resource mutation
  shared host software/config/permissions or provider lifecycle changes
```

Project writes need clear task authority. Host/resource mutations need explicit intent and may also be governed by provider/site-specific skills.

## Read-only probe

Probe only what affects readiness:

- identity and host/platform;
- workspace path, existence, writability, filesystem, and free space;
- project root/revision and environment/run declarations;
- required tools such as git, rsync, uv, tmux, conda/mamba, pixi, mise, or a project container runtime;
- CPU/memory/GPU visibility when relevant;
- scheduler/provider availability;
- target-related jobs, tmux sessions, or project processes.

Prefer bounded commands such as `command -v`, version queries, `df`, `id`, `uname`, `nvidia-smi`, scheduler status, and project-specific status commands. Do not turn a probe into a filesystem crawl or account audit; avoid unrelated projects, shell history, and credentials.

## Readiness result

Report observed facts, blockers for the selected lane, and the smallest proposed bootstrap. Do not install the proposal until mutation authority is established.

Example:

```text
Target: lab-gpu
Lane: unmanaged SSH
Workspace: /data/team/project-a
Observed: workspace writable, GPU visible, conda present, uv/tmux missing
Readiness: blocked
Proposed bootstrap: workspace-local tools prefix with uv and tmux
```
