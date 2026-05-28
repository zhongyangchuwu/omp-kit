# Project Adapter Notes

This AutoDL skill owns connection, API, and lifecycle safety. Your project still owns its own build, sync, train, eval, prediction, and artifact commands.

## Recommended integration

1. Keep real AutoDL values in the project's untracked `secrets.json`.
2. Put shared values such as `AUTODL_TOKEN` and `SSH_KEY` under `shared`.
3. Put each instance under `servers.<name>` with `AUTODL_PRO_INSTANCE_UUID`, `SSH_SERVER`, `SSH_PORT`, and `REMOTE_WORKDIR`.
4. Use project-native commands through SSH:

```bash
uv run --project skills/autodl autodl --server gpu0 ssh -- <project-command>
```

## Do not bake project workflows into this skill

Examples of project-owned commands:

- dependency setup;
- source synchronization;
- dataset synchronization;
- train/eval/predict launchers;
- artifact pullback;
- runlog updates.

Document those in the project. The AutoDL skill should only provide a safe execution channel and resource lifecycle controls.
