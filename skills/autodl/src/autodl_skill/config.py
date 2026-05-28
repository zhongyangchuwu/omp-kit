from __future__ import annotations

import json
import os
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from autodl_skill.safety import redact

DEFAULT_SECRETS_FILE = Path("secrets.json")
DEFAULT_SERVER = "gpu0"
PATH_KEYS = {"SSH_KEY"}
ALLOWED_SSH_UPDATE_KEYS = ("SSH_PORT", "SSH_SERVER")


class ConfigError(RuntimeError):
    """Raised when local AutoDL configuration is missing or invalid."""


class ServerConfig(BaseModel):
    """Known per-server values, while preserving future string keys."""

    model_config = ConfigDict(extra="allow", populate_by_name=True)

    autodl_pro_instance_uuid: str | None = Field(default=None, alias="AUTODL_PRO_INSTANCE_UUID")
    ssh_server: str | None = Field(default=None, alias="SSH_SERVER")
    ssh_port: str | None = Field(default=None, alias="SSH_PORT")
    ssh_key: str | None = Field(default=None, alias="SSH_KEY")
    remote_workdir: str | None = Field(default=None, alias="REMOTE_WORKDIR")

    @field_validator("autodl_pro_instance_uuid", "ssh_server", "ssh_port", "ssh_key", "remote_workdir", mode="before")
    @classmethod
    def stringify_known_values(cls, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            return value
        return str(value)


class Secrets(BaseModel):
    """Top-level secrets.json model."""

    model_config = ConfigDict(extra="allow")

    shared: dict[str, str] = Field(default_factory=dict)
    images: dict[str, str] = Field(default_factory=dict)
    servers: dict[str, ServerConfig] = Field(default_factory=dict)

    @field_validator("shared", "images", mode="before")
    @classmethod
    def validate_string_mapping(cls, value: Any, info: Any) -> dict[str, str]:
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise ValueError(f"{info.field_name} must be a JSON object")
        result: dict[str, str] = {}
        for key, item in value.items():
            if not isinstance(key, str) or not key:
                raise ValueError(f"{info.field_name} keys must be non-empty strings")
            if item is None:
                continue
            result[key] = item if isinstance(item, str) else str(item)
        return result

    @field_validator("servers", mode="before")
    @classmethod
    def validate_servers_mapping(cls, value: Any) -> dict[str, Any]:
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise ValueError("servers must be a JSON object")
        for key, item in value.items():
            if not isinstance(key, str) or not key:
                raise ValueError("server names must be non-empty strings")
            if not isinstance(item, dict):
                raise ValueError(f"server {key} must be a JSON object")
        return value


def load_secrets(path: Path) -> Secrets:
    """Load and validate a secrets.json file."""

    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise ConfigError(f"missing secrets file: {path}") from exc
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ConfigError(f"invalid JSON in {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise ConfigError("secrets file must contain a JSON object")
    try:
        return Secrets.model_validate(payload)
    except ValidationError as exc:
        raise ConfigError(str(exc)) from exc


def _dump_server_config(server: ServerConfig) -> dict[str, str]:
    dumped: dict[str, Any] = server.model_dump(by_alias=True, exclude_none=True)
    extras = server.model_extra or {}
    for key, value in extras.items():
        if value is None:
            continue
        dumped[key] = value if isinstance(value, str) else str(value)
    return {str(key): str(value) for key, value in dumped.items() if value is not None}


def expand_config_value(key: str, value: str) -> str:
    if key in PATH_KEYS:
        return str(Path(os.path.expandvars(value)).expanduser())
    return value


def resolve_server_config(secrets: Secrets, server_name: str, environ: Mapping[str, str] | None = None) -> dict[str, str]:
    """Resolve shared + selected server config, with environment overrides."""

    if server_name not in secrets.servers:
        raise ConfigError(f"unknown server in secrets: {server_name}")
    resolved: dict[str, str] = dict(secrets.shared)
    resolved.update(_dump_server_config(secrets.servers[server_name]))
    for key, value in (environ or {}).items():
        if key in resolved and value:
            resolved[key] = value
    return {key: expand_config_value(key, value) for key, value in resolved.items()}


def resolve_value(
    key: str,
    *,
    cli_value: str | None,
    server_config: Mapping[str, str],
    environ: Mapping[str, str] | None = None,
    default: str | None = None,
) -> str | None:
    """Resolve one value using CLI > environment > config > default."""

    if cli_value:
        return expand_config_value(key, cli_value)
    env_value = (environ or {}).get(key)
    if env_value:
        return expand_config_value(key, env_value)
    config_value = server_config.get(key)
    if config_value:
        return expand_config_value(key, config_value)
    if default is not None:
        return expand_config_value(key, default)
    return None


def redacted_server_summary(
    secrets: Secrets, server_name: str, environ: Mapping[str, str] | None = None
) -> dict[str, Any]:
    config = resolve_server_config(secrets, server_name, environ=environ)
    return {
        "server": server_name,
        "has_autodl_token": bool(config.get("AUTODL_TOKEN")),
        "has_instance_uuid": bool(config.get("AUTODL_PRO_INSTANCE_UUID")),
        "has_ssh_server": bool(config.get("SSH_SERVER")),
        "has_ssh_port": bool(config.get("SSH_PORT")),
        "has_ssh_key": bool(config.get("SSH_KEY")),
        "has_remote_workdir": bool(config.get("REMOTE_WORKDIR")),
        "keys": sorted(config),
    }


def redacted_servers_summary(secrets: Secrets) -> list[dict[str, Any]]:
    return [redacted_server_summary(secrets, name, environ={}) for name in sorted(secrets.servers)]


def update_server_ssh_fields(path: Path, server_name: str, updates: Mapping[str, str]) -> list[str]:
    """Update only SSH_SERVER and SSH_PORT for one server in secrets.json."""

    secrets = load_secrets(path)
    if server_name not in secrets.servers:
        raise ConfigError(f"unknown server in secrets: {server_name}")
    raw_payload = json.loads(path.read_text(encoding="utf-8"))
    raw_payload.setdefault("servers", {}).setdefault(server_name, {})
    changed: list[str] = []
    for key in ALLOWED_SSH_UPDATE_KEYS:
        value = updates.get(key)
        if value:
            raw_payload["servers"][server_name][key] = str(value)
            changed.append(key)
    path.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return changed


def extract_ssh_updates(snapshot: Mapping[str, Any]) -> dict[str, str]:
    """Extract SSH_SERVER and SSH_PORT from known snapshot shapes."""

    data = snapshot.get("data")
    if not isinstance(data, Mapping):
        return {}
    candidates = [data]
    ssh = data.get("ssh")
    if isinstance(ssh, Mapping):
        candidates.append(ssh)
    result: dict[str, str] = {}
    for candidate in candidates:
        server = candidate.get("SSH_SERVER") or candidate.get("ssh_server") or candidate.get("server")
        port = candidate.get("SSH_PORT") or candidate.get("ssh_port") or candidate.get("port")
        if server and "SSH_SERVER" not in result:
            result["SSH_SERVER"] = str(server)
        if port and "SSH_PORT" not in result:
            result["SSH_PORT"] = str(port)
    return result


def redacted_json(payload: Any) -> str:
    return json.dumps(redact(payload), ensure_ascii=False, indent=2, sort_keys=True)
