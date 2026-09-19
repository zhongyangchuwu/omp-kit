# AutoDL Safety Rules

## Secrets

Never print, commit, or paste real tokens, SSH host/port/key paths, full SSH commands, instance/image UUIDs, passwords, Jupyter tokens or snapshot credentials. Use placeholders.

## Billing and lifecycle

| Operation | Meaning | Requirement |
| --- | --- | --- |
| `create-pro` | creates a running paid instance | preview first; real run needs `--confirm --yes-i-have-user-confirmation` |
| `power-pro start` | starts paid compute | preview first; real run needs `--confirm --yes-i-have-user-confirmation` |
| `power-pro stop` | stops pay-as-you-go compute, **not Pro system-disk daily billing** | user-authorized job/resource scope; `--confirm`, then verify status |
| `release-pro` | destroys/releases the retained Pro system disk and ends that instance's retained-disk lifecycle | verify stopped and artifacts copied somewhere that survives release; `--confirm --yes-i-have-user-confirmation` |

This confirmation gate applies to resource API operations, **not** all CLI commands. `ssh`, `sync up/down-run`, and `run submit/kill` can execute immediately. Use sync `--dry-run` or supported redacted `--print-command` to preview. Review overwrite/delete scope and ensure the task authorizes the remote command. A preview is not authorization.

Do not stop a server simply because conversation is waiting. Confirm ownership, ongoing jobs and the user's shutdown policy; do not kill unrelated work.

For AutoDL Pro, **power state and storage cost are separate facts**. Current official documentation says Pro has no separate data disk: its default 30GB system disk and expanded system-disk capacity are billed by day. A stopped Pro instance therefore can still incur daily storage charges while its disk is retained. If the user's goal is to eliminate ongoing idle cost, preserve required artifacts first and discuss/obtain authorization for destructive `release-pro`; verify current billing in the provider console rather than inferring it from `shutdown` status. For prepaid/package products, check the current billing plan because power-off does not imply unused prepaid time is refunded or paused.

## Recommended sequence

1. Verify the named target with redacted `servers` / `server-info`.
2. Read balance/status before paid operations and stock before creating an instance.
3. Preview the appropriate command class.
4. Execute only within explicit task authorization.
5. Read back status/list or the affected artifact after mutation.

## `--update-secrets-ssh`

Only use after a confirmed `power-pro start`. It may update `SSH_SERVER` and `SSH_PORT` for the selected server from snapshot data. It must not update token, key path, image UUID, instance UUID, or project commands.
