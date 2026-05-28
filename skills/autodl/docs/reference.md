# AutoDL CLI Reference

Invoke with:

```bash
uv run --project skills/autodl autodl --secrets-file secrets.json --server gpu0 <command>
```

## Local summaries

```bash
autodl servers
autodl server-info
```

These commands read only local `secrets.json` and print redacted summaries.

## Read-only API commands

```bash
autodl balance
autodl list
autodl status [--instance-uuid <pro-instance-uuid>]
autodl snapshot [--instance-uuid <pro-instance-uuid>]
autodl gpu-stock --region-sign westDC2
autodl deployments
autodl containers --deployment-uuid <deployment-uuid>
```

`snapshot` output is redacted before display.

## Resource changes

All resource changes are dry-run by default:

```bash
autodl create-pro --gpu-spec-uuid 5090-p --image-uuid <image-uuid>
autodl power-pro start
autodl power-pro stop
autodl release-pro --instance-uuid <pro-instance-uuid>
```

Real execution:

```bash
autodl create-pro --gpu-spec-uuid 5090-p --image-uuid <image-uuid> --confirm --yes-i-have-user-confirmation
autodl power-pro start --confirm --yes-i-have-user-confirmation --update-secrets-ssh
autodl power-pro stop --confirm
autodl release-pro --instance-uuid <pro-instance-uuid> --confirm --yes-i-have-user-confirmation
```

## SSH

```bash
autodl ssh -- hostname
autodl ssh -- nvidia-smi
autodl ssh --print-command -- hostname
```

The remote command runs after setting a basic PATH and entering `REMOTE_WORKDIR`.
