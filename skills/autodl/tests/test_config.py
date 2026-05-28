from __future__ import annotations

import json
from pathlib import Path

import pytest

from autodl_skill.config import (
    ConfigError,
    load_secrets,
    redacted_server_summary,
    resolve_server_config,
    resolve_value,
    update_server_ssh_fields,
)


def write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def sample_secrets() -> dict[str, object]:
    return {
        "shared": {
            "AUTODL_TOKEN": "token-secret",
            "SSH_KEY": "${HOME}/.ssh/AutoDL",
            "REMOTE_WORKDIR": "/root/autodl-tmp/shared",
        },
        "images": {"default": "image-secret"},
        "servers": {
            "gpu0": {
                "AUTODL_PRO_INSTANCE_UUID": "uuid-gpu0",
                "SSH_SERVER": "root@gpu0.example.com",
                "SSH_PORT": "10000",
                "REMOTE_WORKDIR": "/root/autodl-tmp/project0",
            },
            "gpu1": {
                "AUTODL_PRO_INSTANCE_UUID": "uuid-gpu1",
                "SSH_SERVER": "root@gpu1.example.com",
                "SSH_PORT": "10001",
            },
        },
    }


def test_load_secrets_reports_missing_file(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="missing secrets file"):
        load_secrets(tmp_path / "secrets.json")


def test_load_secrets_reports_invalid_json(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    path.write_text("not-json", encoding="utf-8")

    with pytest.raises(ConfigError, match="invalid JSON"):
        load_secrets(path)


def test_load_secrets_requires_json_object(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    write_json(path, [])

    with pytest.raises(ConfigError, match="JSON object"):
        load_secrets(path)


def test_load_secrets_requires_shared_and_servers_objects(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    write_json(path, {"shared": [], "servers": {}})

    with pytest.raises(ConfigError, match="shared"):
        load_secrets(path)

    write_json(path, {"shared": {}, "servers": []})

    with pytest.raises(ConfigError, match="servers"):
        load_secrets(path)


def test_resolve_server_config_merges_shared_and_server_with_path_expansion(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("HOME", str(tmp_path))
    path = tmp_path / "secrets.json"
    write_json(path, sample_secrets())
    secrets = load_secrets(path)

    config = resolve_server_config(secrets, "gpu0", environ={})

    assert config["AUTODL_TOKEN"] == "token-secret"
    assert config["AUTODL_PRO_INSTANCE_UUID"] == "uuid-gpu0"
    assert config["SSH_SERVER"] == "root@gpu0.example.com"
    assert config["SSH_PORT"] == "10000"
    assert config["REMOTE_WORKDIR"] == "/root/autodl-tmp/project0"
    assert config["SSH_KEY"] == str(tmp_path / ".ssh" / "AutoDL")


def test_resolve_server_config_uses_environment_override(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    write_json(path, sample_secrets())
    secrets = load_secrets(path)

    config = resolve_server_config(secrets, "gpu0", environ={"SSH_PORT": "2222"})

    assert config["SSH_PORT"] == "2222"


def test_resolve_server_config_rejects_unknown_server(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    write_json(path, sample_secrets())
    secrets = load_secrets(path)

    with pytest.raises(ConfigError, match="unknown server"):
        resolve_server_config(secrets, "missing", environ={})


def test_resolve_value_precedence() -> None:
    assert (
        resolve_value(
            "SSH_PORT",
            cli_value="1111",
            server_config={"SSH_PORT": "2222"},
            environ={"SSH_PORT": "3333"},
            default="4444",
        )
        == "1111"
    )
    assert (
        resolve_value(
            "SSH_PORT",
            cli_value=None,
            server_config={"SSH_PORT": "2222"},
            environ={"SSH_PORT": "3333"},
            default="4444",
        )
        == "3333"
    )
    assert (
        resolve_value(
            "SSH_PORT",
            cli_value=None,
            server_config={"SSH_PORT": "2222"},
            environ={},
            default="4444",
        )
        == "2222"
    )
    assert resolve_value("SSH_PORT", cli_value=None, server_config={}, environ={}, default="4444") == "4444"


def test_redacted_server_summary_does_not_expose_sensitive_values(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    write_json(path, sample_secrets())
    secrets = load_secrets(path)

    summary = redacted_server_summary(secrets, "gpu0", environ={})
    rendered = json.dumps(summary, ensure_ascii=False)

    assert "gpu0" in rendered
    assert "token-secret" not in rendered
    assert "uuid-gpu0" not in rendered
    assert "gpu0.example.com" not in rendered
    assert "10000" not in rendered
    assert "AutoDL" not in rendered
    assert summary["has_autodl_token"] is True
    assert summary["has_instance_uuid"] is True
    assert summary["has_ssh_server"] is True
    assert summary["has_ssh_port"] is True


def test_update_server_ssh_fields_updates_only_ssh_server_and_port(tmp_path: Path) -> None:
    path = tmp_path / "secrets.json"
    original = sample_secrets()
    write_json(path, original)

    updated = update_server_ssh_fields(
        path,
        "gpu0",
        {"SSH_SERVER": "root@new.example.com", "SSH_PORT": "20000", "AUTODL_TOKEN": "evil"},
    )

    payload = json.loads(path.read_text(encoding="utf-8"))
    assert updated == ["SSH_PORT", "SSH_SERVER"]
    assert payload["servers"]["gpu0"]["SSH_SERVER"] == "root@new.example.com"
    assert payload["servers"]["gpu0"]["SSH_PORT"] == "20000"
    assert payload["shared"]["AUTODL_TOKEN"] == "token-secret"
    assert payload["servers"]["gpu0"]["AUTODL_PRO_INSTANCE_UUID"] == "uuid-gpu0"
