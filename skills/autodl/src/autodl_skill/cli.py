from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Annotated, Any

import typer
from rich.console import Console

from autodl_skill.api import AutoDLApiError, AutoDLClient, DEFAULT_API_HOST
from autodl_skill.config import (
    DEFAULT_SECRETS_FILE,
    DEFAULT_SERVER,
    ConfigError,
    extract_ssh_updates,
    load_secrets,
    redacted_json,
    redacted_server_summary,
    redacted_servers_summary,
    resolve_server_config,
    resolve_value,
    update_server_ssh_fields,
)
from autodl_skill.safety import ConfirmationError, dry_run_payload, require_confirmation
from autodl_skill.ssh import SSHConfig, run_ssh_command

app = typer.Typer(help="Safe AutoDL Pro multi-instance helper.")
console = Console()


class Context:
    def __init__(self, secrets_file: Path, server: str, api_host: str | None, timeout: float) -> None:
        self.secrets_file = secrets_file
        self.server = server
        self.api_host = api_host
        self.timeout = timeout
        self._secrets = None
        self._server_config: dict[str, str] | None = None

    @property
    def secrets(self):  # type: ignore[no-untyped-def]
        if self._secrets is None:
            self._secrets = load_secrets(self.secrets_file)
        return self._secrets

    @property
    def server_config(self) -> dict[str, str]:
        if self._server_config is None:
            self._server_config = resolve_server_config(self.secrets, self.server, environ=os.environ)
        return self._server_config

    def token(self) -> str:
        token = resolve_value(
            "AUTODL_TOKEN", cli_value=None, server_config=self.server_config, environ=os.environ
        )
        if not token:
            raise ConfigError("missing AUTODL_TOKEN in secrets or environment")
        return token

    def client(self) -> AutoDLClient:
        api_host = self.api_host or os.environ.get("AUTODL_API_HOST") or DEFAULT_API_HOST
        return AutoDLClient(token=self.token(), api_host=api_host, timeout_seconds=self.timeout)

    def instance_uuid(self, override: str | None = None) -> str:
        value = resolve_value(
            "AUTODL_PRO_INSTANCE_UUID",
            cli_value=override,
            server_config=self.server_config,
            environ=os.environ,
        )
        if not value:
            raise ConfigError("missing AUTODL_PRO_INSTANCE_UUID; pass --instance-uuid or configure server")
        return value


@app.callback()
def main(
    ctx: typer.Context,
    secrets_file: Annotated[
        Path, typer.Option("--secrets-file", help="Path to local secrets.json.")
    ] = DEFAULT_SECRETS_FILE,
    server: Annotated[str, typer.Option("--server", help="Server name under secrets.servers.")] = DEFAULT_SERVER,
    api_host: Annotated[str | None, typer.Option("--api-host", help="AutoDL API host.")] = None,
    timeout: Annotated[float, typer.Option("--timeout", help="HTTP or SSH timeout in seconds.")] = 20.0,
) -> None:
    ctx.obj = Context(secrets_file=secrets_file, server=server, api_host=api_host, timeout=timeout)


def get_context(ctx: typer.Context) -> Context:
    return ctx.obj


def print_payload(payload: Any) -> None:
    console.print(redacted_json(payload))


@app.command("servers")
def servers(ctx: typer.Context) -> None:
    state = get_context(ctx)
    print_payload(redacted_servers_summary(state.secrets))


@app.command("server-info")
def server_info(ctx: typer.Context) -> None:
    state = get_context(ctx)
    print_payload(redacted_server_summary(state.secrets, state.server, environ=os.environ))


@app.command("balance")
def balance(ctx: typer.Context) -> None:
    print_payload(get_context(ctx).client().balance())


@app.command("list")
def list_instances(ctx: typer.Context, page_index: int = 1, page_size: int = 10) -> None:
    print_payload(get_context(ctx).client().list_instances(page_index=page_index, page_size=page_size))


@app.command("status")
def status(ctx: typer.Context, instance_uuid: str | None = None) -> None:
    state = get_context(ctx)
    print_payload(state.client().status(state.instance_uuid(instance_uuid)))


@app.command("snapshot")
def snapshot(ctx: typer.Context, instance_uuid: str | None = None) -> None:
    state = get_context(ctx)
    print_payload(state.client().snapshot(state.instance_uuid(instance_uuid)))


@app.command("gpu-stock")
def gpu_stock(
    ctx: typer.Context,
    region_sign: Annotated[str, typer.Option("--region-sign")],
    cuda_v_from: Annotated[int, typer.Option("--cuda-v-from")] = 117,
    cuda_v_to: Annotated[int, typer.Option("--cuda-v-to")] = 128,
) -> None:
    print_payload(
        get_context(ctx).client().gpu_stock(
            region_sign=region_sign, cuda_v_from=cuda_v_from, cuda_v_to=cuda_v_to
        )
    )


@app.command("deployments")
def deployments(
    ctx: typer.Context,
    page_index: int = 1,
    page_size: int = 10,
    status_filter: Annotated[str | None, typer.Option("--status")] = None,
    deployment_uuid: Annotated[str | None, typer.Option("--deployment-uuid")] = None,
) -> None:
    print_payload(
        get_context(ctx).client().list_deployments(
            page_index=page_index,
            page_size=page_size,
            status=status_filter,
            deployment_uuid=deployment_uuid,
        )
    )


@app.command("containers")
def containers(
    ctx: typer.Context,
    deployment_uuid: Annotated[str, typer.Option("--deployment-uuid")],
    page_index: int = 1,
    page_size: int = 10,
    container_uuid: Annotated[str | None, typer.Option("--container-uuid")] = None,
    status_filter: Annotated[list[str] | None, typer.Option("--status")] = None,
    released: Annotated[bool, typer.Option("--released")] = False,
) -> None:
    print_payload(
        get_context(ctx).client().list_deployment_containers(
            deployment_uuid=deployment_uuid,
            page_index=page_index,
            page_size=page_size,
            container_uuid=container_uuid,
            status=status_filter,
            released=released,
        )
    )


def build_create_payload(
    *,
    gpu_spec_uuid: str,
    image_uuid: str,
    cuda_v_from: int,
    expand_system_disk_by_gb: int,
    instance_name: str,
    data_center: list[str] | None,
    start_command: str | None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "gpu_spec_uuid": gpu_spec_uuid,
        "image_uuid": image_uuid,
        "cuda_v_from": cuda_v_from,
        "expand_system_disk_by_gb": expand_system_disk_by_gb,
        "instance_name": instance_name,
    }
    if data_center:
        payload["data_center"] = data_center
    if start_command:
        payload["start_command"] = start_command
    return payload


@app.command("create-pro")
def create_pro(
    ctx: typer.Context,
    gpu_spec_uuid: Annotated[str, typer.Option("--gpu-spec-uuid")] = "5090-p",
    image_uuid: Annotated[str, typer.Option("--image-uuid")] = "<image-uuid>",
    cuda_v_from: Annotated[int, typer.Option("--cuda-v-from")] = 118,
    expand_system_disk_by_gb: Annotated[int, typer.Option("--expand-system-disk-by-gb")] = 0,
    instance_name: Annotated[str, typer.Option("--instance-name")] = "autodl-pro-instance",
    data_center: Annotated[list[str] | None, typer.Option("--data-center")] = None,
    start_command: Annotated[str | None, typer.Option("--start-command")] = None,
    confirm: bool = False,
    yes_i_have_user_confirmation: bool = False,
) -> None:
    payload = build_create_payload(
        gpu_spec_uuid=gpu_spec_uuid,
        image_uuid=image_uuid,
        cuda_v_from=cuda_v_from,
        expand_system_disk_by_gb=expand_system_disk_by_gb,
        instance_name=instance_name,
        data_center=data_center,
        start_command=start_command,
    )
    require_confirmation(
        "create-pro", confirm=confirm, yes_i_have_user_confirmation=yes_i_have_user_confirmation
    )
    if not confirm:
        print_payload(dry_run_payload("create-pro", payload))
        return
    print_payload(get_context(ctx).client().create_pro(payload))


@app.command("power-pro")
def power_pro(
    ctx: typer.Context,
    action: Annotated[str, typer.Argument(help="start or stop")],
    instance_uuid: Annotated[str | None, typer.Option("--instance-uuid")] = None,
    confirm: bool = False,
    yes_i_have_user_confirmation: bool = False,
    wait_seconds: Annotated[int, typer.Option("--wait-seconds")] = 300,
    poll_interval_seconds: Annotated[int, typer.Option("--poll-interval-seconds")] = 5,
    update_secrets_ssh: bool = False,
) -> None:
    if action not in {"start", "stop"}:
        raise typer.BadParameter("action must be start or stop")
    state = get_context(ctx)
    uuid = state.instance_uuid(instance_uuid)
    command = f"power-pro {action}"
    require_confirmation(
        command, confirm=confirm, yes_i_have_user_confirmation=yes_i_have_user_confirmation
    )
    if not confirm:
        print_payload(dry_run_payload(command, {"instance_uuid": uuid}))
        return
    client = state.client()
    if action == "start":
        response = client.power_on_pro(uuid)
        updates: list[str] = []
        if wait_seconds > 0:
            deadline = time.monotonic() + wait_seconds
            while time.monotonic() < deadline:
                status_payload = client.status(uuid)
                if str(status_payload.get("data")) == "running":
                    break
                time.sleep(max(poll_interval_seconds, 1))
        if update_secrets_ssh:
            ssh_updates = extract_ssh_updates(client.snapshot(uuid))
            updates = update_server_ssh_fields(state.secrets_file, state.server, ssh_updates)
        print_payload({"code": "Success", "action": action, "response": response, "updated_keys": updates})
        return
    response = client.power_off_pro(uuid)
    print_payload({"code": "Success", "action": action, "response": response})


@app.command("release-pro")
def release_pro(
    ctx: typer.Context,
    instance_uuid: Annotated[str, typer.Option("--instance-uuid")],
    confirm: bool = False,
    yes_i_have_user_confirmation: bool = False,
) -> None:
    require_confirmation(
        "release-pro", confirm=confirm, yes_i_have_user_confirmation=yes_i_have_user_confirmation
    )
    if not confirm:
        print_payload(dry_run_payload("release-pro", {"instance_uuid": instance_uuid}))
        return
    print_payload(get_context(ctx).client().release_pro(instance_uuid))


@app.command(context_settings={"allow_extra_args": True, "ignore_unknown_options": True})
def ssh(
    ctx: typer.Context,
    ssh_server: Annotated[str | None, typer.Option("--ssh-server")] = None,
    ssh_port: Annotated[str | None, typer.Option("--ssh-port")] = None,
    ssh_key: Annotated[Path | None, typer.Option("--ssh-key")] = None,
    remote_workdir: Annotated[str | None, typer.Option("--remote-workdir")] = None,
    print_command: bool = False,
) -> None:
    state = get_context(ctx)
    command_parts = list(ctx.args)
    if command_parts and command_parts[0] == "--":
        command_parts = command_parts[1:]
    if not command_parts:
        raise typer.BadParameter("ssh requires a command after --")
    server = resolve_value(
        "SSH_SERVER", cli_value=ssh_server, server_config=state.server_config, environ=os.environ
    )
    if not server:
        raise ConfigError("missing SSH_SERVER")
    port = resolve_value("SSH_PORT", cli_value=ssh_port, server_config=state.server_config, environ=os.environ)
    key_value = resolve_value(
        "SSH_KEY",
        cli_value=str(ssh_key) if ssh_key is not None else None,
        server_config=state.server_config,
        environ=os.environ,
    )
    workdir = resolve_value(
        "REMOTE_WORKDIR",
        cli_value=remote_workdir,
        server_config=state.server_config,
        environ=os.environ,
        default="/root/autodl-tmp",
    )
    result = run_ssh_command(
        SSHConfig(server=server, port=port, key=Path(key_value) if key_value else None),
        command_parts,
        remote_workdir=workdir or "/root/autodl-tmp",
        print_command=print_command,
        timeout_seconds=state.timeout,
    )
    if result.stdout:
        console.print(result.stdout)
    if result.stderr:
        console.print(result.stderr, stderr=True)
    raise typer.Exit(result.returncode)


def run() -> None:
    try:
        app()
    except (ConfigError, ConfirmationError, AutoDLApiError) as exc:
        console.print(json.dumps({"code": "Error", "message": str(exc)}, ensure_ascii=False))
        raise typer.Exit(1) from exc


if __name__ == "__main__":
    run()
