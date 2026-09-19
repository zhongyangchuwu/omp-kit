# Workspace-Local Bootstrap

Use this reference when required experiment infrastructure is missing.

## Default strategy

Prefer a removable workspace-local layer over changing the host. When useful, keep generic tooling under:

```text
<workspace>/.experiment/
  bin/
  envs/
  cache/
  env.sh
```

Do not require this exact layout when the project already has an equivalent convention.

Avoid modifying system package state, system Python/CUDA, GPU drivers, base Conda, `/etc`, or shell startup files merely to make an experiment convenient. Do not run `conda init` for agent execution. Host-level configuration requires separate explicit authorization.

## Respect the project environment

Existing project declarations win:

- `pixi.toml` / `pixi.lock` -> Pixi;
- existing uv project / `uv.lock` -> uv;
- `environment.yml`, conda-lock, or documented Conda workflow -> Conda/Mamba;
- `mise.toml` -> mise may own toolchain versions while the project package manager still owns dependencies;
- Docker/Apptainer/custom setup -> follow the project model.

Do not migrate an existing project just to satisfy this skill.

## Generic node tooling

For ordinary SSH Linux without a project-owned solution:

1. **Conda/Mamba exists:** prefer a workspace-local tools prefix, for example `conda create -y -p "$WORKSPACE/.experiment/envs/tools" -c conda-forge uv tmux`. Do not modify `base`.
2. **No Conda, Python-focused project:** install current official standalone uv into the workspace without editing shell startup files. If the unmanaged SSH lane needs tmux, install a portable/static or user-space tmux build into the workspace.
3. **Conda/native ecosystem required but Conda absent:** use workspace-local micromamba or another project-approved portable Conda-compatible bootstrap.
4. **Pixi:** use when the project already declares Pixi or a new project intentionally chooses it for reproducible Conda/native plus PyPI dependencies.
5. **mise:** use when heterogeneous toolchain versioning is actually needed; it is not a mandatory experiment baseline.

Do not silently fall back to a transient foreground shell when the selected lane requires durable execution.

## `env.sh`

Use a workspace-local `env.sh` when repeated commands would otherwise repeat paths or cache variables:

```bash
export WORKSPACE="/data/team/project-a"
export EXPERIMENT_ROOT="$WORKSPACE/.experiment"
export PATH="$EXPERIMENT_ROOT/bin:$EXPERIMENT_ROOT/envs/tools/bin:$PATH"
export UV_CACHE_DIR="$EXPERIMENT_ROOT/cache/uv"
```

Keep it idempotent and limited to environment/configuration: no package installation, network access, process launch, implicit `cd`, or required shell-profile edits. An existing project `.env` may continue to hold project configuration/secrets according to that project's convention; never commit or print real secrets.

## Bootstrap gate

1. Probe read-only.
2. Identify the missing capability.
3. Select the smallest workspace-local change.
4. Verify the request authorizes that change.
5. Apply it.
6. Re-probe versions, paths, permissions, disk, and the selected lane.
7. Continue only when the target satisfies the chosen contract.

If satisfying the contract requires broader host changes, report the blocker instead of silently weakening the execution model.
