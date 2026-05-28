# AutoDL Skill

Reusable AutoDL Pro helper for agent workflows. It provides:

- multi-instance `secrets.json` configuration;
- AutoDL Developer API read-only commands;
- dry-run-first Pro instance create/start/stop/release commands;
- SSH smoke tests and remote command execution;
- redacted output for secret-bearing data.

## Usage

From the workspace root:

```bash
uv run --project skills/autodl autodl --help
uv run --project skills/autodl autodl --secrets-file secrets.json servers
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 status
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
