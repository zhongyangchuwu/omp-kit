# AutoDL Safety Rules

## Secrets

Never print, commit, or paste real values for:

- `AUTODL_TOKEN`;
- SSH host, port, private key path, or full SSH command;
- Pro instance UUID;
- private image UUID;
- password, Jupyter token, or snapshot credentials.

Use placeholders such as `<developer-token>`, `<pro-instance-uuid>`, `<host>`, and `<port>`.

## Billing and lifecycle

| Operation | Meaning | Requirement |
| --- | --- | --- |
| `create-pro` | creates a running paid instance | dry-run first; real run needs `--confirm --yes-i-have-user-confirmation` |
| `power-pro start` | starts paid compute | dry-run first; real run needs `--confirm --yes-i-have-user-confirmation` |
| `power-pro stop` | stops compute | real run needs `--confirm`; verify status after |
| `release-pro` | releases system disk | verify stopped and artifacts first; real run needs `--confirm --yes-i-have-user-confirmation` |

## Recommended sequence

1. `servers` and `server-info` to verify target selection without exposing values.
2. `balance` and `status` before paid operations.
3. `gpu-stock` before creating a new instance.
4. Dry-run the planned resource change.
5. Execute with confirmation only after explicit user approval.
6. After stop/release, run `status` or `list` to verify final state.

## `--update-secrets-ssh`

Only use after a confirmed `power-pro start`. It may update `SSH_SERVER` and `SSH_PORT` for the selected server from snapshot data. It must not update token, key path, image UUID, instance UUID, or project commands.
