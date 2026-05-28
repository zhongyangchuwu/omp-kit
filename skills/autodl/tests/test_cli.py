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
