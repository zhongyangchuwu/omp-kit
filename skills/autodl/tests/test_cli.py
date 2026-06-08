from __future__ import annotations

import json
from pathlib import Path

from typer.testing import CliRunner

from autodl_skill import cli
from autodl_skill.cli import app

runner = CliRunner()


def write_secrets(path: Path) -> None:
    payload = {
        "shared": {"AUTODL_TOKEN": "token-secret", "SSH_KEY": "${HOME}/.ssh/AutoDL"},
        "images": {"default": "image-secret"},
        "servers": {
            "gpu0": {
                "AUTODL_PRO_INSTANCE_UUID": "uuid-gpu0",
                "SSH_SERVER": "root@gpu0.example.com",
                "SSH_PORT": "10000",
                "REMOTE_WORKDIR": "/root/project0",
            },
            "gpu1": {
                "AUTODL_PRO_INSTANCE_UUID": "uuid-gpu1",
                "SSH_SERVER": "root@gpu1.example.com",
                "SSH_PORT": "10001",
                "REMOTE_WORKDIR": "/root/project1",
            },
        },
    }
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


class FakeClient:
    last: "FakeClient | None" = None

    def __init__(self, token: str, api_host: str = "https://api.autodl.com", timeout_seconds: float = 20.0):
        self.token = token
        self.api_host = api_host
        self.timeout_seconds = timeout_seconds
        self.calls: list[tuple[str, object]] = []
        FakeClient.last = self

    def status(self, instance_uuid: str) -> dict[str, object]:
        self.calls.append(("status", instance_uuid))
        return {"code": "Success", "data": "running", "instance_uuid": instance_uuid}

    def create_pro(self, payload: dict[str, object]) -> dict[str, object]:
        self.calls.append(("create_pro", payload))
        return {"code": "Success", "data": {"instance_uuid": "created-uuid"}}

    def power_on_pro(self, instance_uuid: str) -> dict[str, object]:
        self.calls.append(("power_on_pro", instance_uuid))
        return {"code": "Success", "data": "ok"}

    def snapshot(self, instance_uuid: str) -> dict[str, object]:
        self.calls.append(("snapshot", instance_uuid))
        return {
            "code": "Success",
            "data": {
                "ssh_server": "root@new.example.com",
                "ssh_port": "20000",
                "root_password": "pw",
            },
        }


def test_servers_lists_names_without_secret_values(tmp_path: Path) -> None:
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    result = runner.invoke(app, ["--secrets-file", str(secrets), "servers"])

    assert result.exit_code == 0
    assert "gpu0" in result.output
    assert "gpu1" in result.output
    assert "token-secret" not in result.output
    assert "uuid-gpu0" not in result.output
    assert "gpu0.example.com" not in result.output


def test_server_info_outputs_redacted_summary(tmp_path: Path) -> None:
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    result = runner.invoke(app, ["--secrets-file", str(secrets), "--server", "gpu0", "server-info"])

    assert result.exit_code == 0
    assert "gpu0" in result.output
    assert "token-secret" not in result.output
    assert "uuid-gpu0" not in result.output
    assert "gpu0.example.com" not in result.output
    assert "10000" not in result.output


def test_status_uses_selected_server_uuid(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)
    monkeypatch.setattr(cli, "AutoDLClient", FakeClient)

    result = runner.invoke(app, ["--secrets-file", str(secrets), "--server", "gpu1", "status"])

    assert result.exit_code == 0
    assert FakeClient.last is not None
    assert FakeClient.last.calls == [("status", "uuid-gpu1")]
    assert "uuid-gpu1" not in result.output


def test_status_instance_uuid_option_overrides_configured_uuid(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)
    monkeypatch.setattr(cli, "AutoDLClient", FakeClient)

    result = runner.invoke(
        app,
        ["--secrets-file", str(secrets), "--server", "gpu1", "status", "--instance-uuid", "override-uuid"],
    )

    assert result.exit_code == 0
    assert FakeClient.last is not None
    assert FakeClient.last.calls == [("status", "override-uuid")]
    assert "override-uuid" not in result.output


def test_create_pro_without_confirm_is_dry_run_and_does_not_call_api(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)
    monkeypatch.setattr(cli, "AutoDLClient", FakeClient)

    FakeClient.last = None
    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "create-pro",
            "--gpu-spec-uuid",
            "5090-p",
            "--image-uuid",
            "image-secret",
        ],
    )

    assert result.exit_code == 0
    assert "dry_run" in result.output
    assert "image-secret" not in result.output
    assert FakeClient.last is None or FakeClient.last.calls == []


def test_power_start_update_secrets_ssh_updates_only_ssh_fields(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)
    monkeypatch.setattr(cli, "AutoDLClient", FakeClient)

    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "--server",
            "gpu0",
            "power-pro",
            "start",
            "--confirm",
            "--yes-i-have-user-confirmation",
            "--update-secrets-ssh",
            "--wait-seconds",
            "0",
        ],
    )

    assert result.exit_code == 0
    payload = json.loads(secrets.read_text(encoding="utf-8"))
    assert payload["servers"]["gpu0"]["SSH_SERVER"] == "root@new.example.com"
    assert payload["servers"]["gpu0"]["SSH_PORT"] == "20000"
    assert payload["shared"]["AUTODL_TOKEN"] == "token-secret"
    assert payload["servers"]["gpu0"]["AUTODL_PRO_INSTANCE_UUID"] == "uuid-gpu0"
    assert "new.example.com" not in result.output
    assert "20000" not in result.output


def test_sync_up_print_command_uses_config_and_redacts_target(tmp_path: Path) -> None:
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "--server",
            "gpu0",
            "sync",
            "up",
            "--local-path",
            ".",
            "--print-command",
        ],
    )

    assert result.exit_code == 0
    assert "<rsync-command>" in result.output
    assert "root@gpu0.example.com" not in result.output
    assert "10000" not in result.output
    assert "--exclude=outputs/" in result.output


def test_sync_down_run_print_command_pulls_only_named_archive(tmp_path: Path) -> None:
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "--server",
            "gpu0",
            "sync",
            "down-run",
            "exp-a",
            "--print-command",
        ],
    )

    assert result.exit_code == 0
    assert "<rsync-command>" in result.output
    assert "outputs/runs/exp-a" in result.output
    assert "root@gpu0.example.com" not in result.output
    assert "10000" not in result.output


def test_run_submit_print_command_builds_logged_tmux_command(tmp_path: Path) -> None:
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "--server",
            "gpu0",
            "run",
            "submit",
            "exp-a",
            "--print-command",
            "--",
            "uv",
            "run",
            "python",
            "scripts/train.py",
        ],
    )

    assert result.exit_code == 0
    assert "<ssh-command>" in result.output
    assert "tmux" in result.output
    assert "outputs/runs/exp-a/logs/remote.log" in result.output
    assert "root@gpu0.example.com" not in result.output
    assert "10000" not in result.output


def test_run_status_print_command_queries_logs_and_gpu(tmp_path: Path) -> None:
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "--server",
            "gpu0",
            "run",
            "status",
            "exp-a",
            "--print-command",
        ],
    )

    assert result.exit_code == 0
    assert "<ssh-command>" in result.output
    assert "nvidia-smi" in result.output
    assert "remote.log.status" in result.output
    assert "root@gpu0.example.com" not in result.output
    assert "10000" not in result.output


def test_check_print_command_shows_local_and_remote_preflight(tmp_path: Path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    secrets = tmp_path / "secrets.json"
    write_secrets(secrets)

    class FakeCheckResult:
        returncode = 0
        stdout = "remote_workdir=/root/project\nworkdir=ok\ntmux=ok\nnvidia_smi=ok\n"
        stderr = ""

    monkeypatch.setattr(cli, "local_rsync_available", lambda: True)
    monkeypatch.setattr(cli, "run_check", lambda *args, **kwargs: FakeCheckResult())

    result = runner.invoke(
        app,
        [
            "--secrets-file",
            str(secrets),
            "--server",
            "gpu0",
            "check",
            "--print-command",
        ],
    )

    assert result.exit_code == 0
    assert "local_rsync=ok" in result.output
    assert "remote_workdir=/root/project" in result.output
