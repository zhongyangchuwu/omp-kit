# AutoDL Skill

Reusable AutoDL Pro helper for agent workflows. It provides:

- multi-instance `secrets.json` configuration;
- AutoDL Developer API read-only commands;
- dry-run-first Pro instance create/start/stop/release commands;
- SSH smoke tests and remote command execution;
- rsync-based code upload and named run artifact pullback;
- logged remote experiment runs with status, tail, and kill helpers;
- redacted output for secret-bearing data.

## Usage

From the workspace root:

```bash
uv run --project skills/autodl autodl --help
uv run --project skills/autodl autodl --secrets-file secrets.json servers
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 status
```

Common remote workflow:

```bash
uv run --project skills/autodl autodl --server gpu0 check
uv run --project skills/autodl autodl --server gpu0 sync up --print-command
uv run --project skills/autodl autodl --server gpu0 sync up
uv run --project skills/autodl autodl --server gpu0 ssh -- nvidia-smi
uv run --project skills/autodl autodl --server gpu0 run submit exp-a -- \
  uv run python scripts/train.py --run-name exp-a
uv run --project skills/autodl autodl --server gpu0 run status exp-a
uv run --project skills/autodl autodl --server gpu0 run tail exp-a --lines 40
uv run --project skills/autodl autodl --server gpu0 sync down-run exp-a
```

Default values:

```text
--secrets-file secrets.json
--server gpu0
```

## Configuration

Create a local untracked `secrets.json` using `examples/secrets.example.json` as the shape. Keep real values out of docs, commits, runlogs, and chat.

Resolution order:

```text
CLI option > environment variable > servers.<server> > shared > safe default
```

## Verification

```bash
uv run --project skills/autodl pytest skills/autodl/tests
uv run --project skills/autodl ruff check skills/autodl
```
