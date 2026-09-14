# AutoDL Safety Rules

## Secrets

Never print, commit, or paste real tokens, SSH host/port/key paths, full SSH commands, instance/image UUIDs, passwords, Jupyter tokens or snapshot credentials. Use placeholders.

## Billing and lifecycle

| Operation | Meaning | Requirement |
| --- | --- | --- |
| `create-pro` | creates a running paid instance | preview first; real run needs `--confirm --yes-i-have-user-confirmation` |
| `power-pro start` | starts paid compute | preview first; real run needs `--confirm --yes-i-have-user-confirmation` |
| `power-pro stop` | stops compute | user-authorized job/resource scope; `--confirm`, then verify status |
| `release-pro` | releases system disk | verify stopped and retained artifacts; `--confirm --yes-i-have-user-confirmation` |

This confirmation gate applies to resource API operations, **not** all CLI commands. `ssh`, `sync up/down-run`, and `run submit/kill` can execute immediately. Use sync `--dry-run` or supported redacted `--print-command` to preview. Review overwrite/delete scope and ensure the task authorizes the remote command. A preview is not authorization.

Do not stop a server simply because conversation is waiting. Confirm ownership, ongoing jobs and the user's shutdown policy; do not kill unrelated work.

## Recommended sequence

1. Verify the named target with redacted `servers` / `server-info`.
2. Read balance/status before paid operations and stock before creating an instance.
3. Preview the appropriate command class.
4. Execute only within explicit task authorization.
5. Read back status/list or the affected artifact after mutation.

## `--update-secrets-ssh`

Only use after a confirmed `power-pro start`. It may update `SSH_SERVER` and `SSH_PORT` for the selected server from snapshot data. It must not update token, key path, image UUID, instance UUID, or project commands.
