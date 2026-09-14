from __future__ import annotations

from dataclasses import dataclass
from typing import Any

SENSITIVE_KEY_PARTS = (
    "password",
    "token",
    "secret",
    "authorization",
    "ssh_command",
    "ssh_server",
    "ssh_port",
    "instance_uuid",
    "image_uuid",
)
RESOURCE_CHANGE_COMMANDS = {"create-pro", "power-pro start", "power-pro stop", "release-pro"}
SECOND_CONFIRMATION_COMMANDS = {"create-pro", "power-pro start", "release-pro"}


class ConfirmationError(RuntimeError):
    """Raised when a resource-changing command lacks required confirmation."""


@dataclass(frozen=True)
class ResourcePlan:
    command: str
    is_resource_change: bool
    dry_run: bool
    requires_user_confirmation: bool


def is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    return any(part in lowered for part in SENSITIVE_KEY_PARTS)


def redact(value: Any) -> Any:
    """Recursively redact secret-like fields while preserving structure."""

    if isinstance(value, dict):
        redacted: dict[Any, Any] = {}
        for key, item in value.items():
            if isinstance(key, str) and is_sensitive_key(key):
                redacted[key] = "<redacted>"
            else:
                redacted[key] = redact(item)
        return redacted
    if isinstance(value, list):
        return [redact(item) for item in value]
    if isinstance(value, tuple):
        return tuple(redact(item) for item in value)
    return value


def normalize_command(command: str) -> str:
    return " ".join(command.strip().split())


def resource_plan(command: str, *, confirm: bool, yes_i_have_user_confirmation: bool) -> ResourcePlan:
    normalized = normalize_command(command)
    is_resource_change = normalized in RESOURCE_CHANGE_COMMANDS
    return ResourcePlan(
        command=normalized,
        is_resource_change=is_resource_change,
        dry_run=is_resource_change and not confirm,
        requires_user_confirmation=normalized in SECOND_CONFIRMATION_COMMANDS,
    )


def require_confirmation(command: str, *, confirm: bool, yes_i_have_user_confirmation: bool) -> None:
    plan = resource_plan(
        command, confirm=confirm, yes_i_have_user_confirmation=yes_i_have_user_confirmation
    )
    if not plan.is_resource_change or not confirm:
        return
    if plan.requires_user_confirmation and not yes_i_have_user_confirmation:
        raise ConfirmationError(
            f"{plan.command} requires explicit user confirmation: pass --yes-i-have-user-confirmation"
        )


def dry_run_payload(command: str, payload: dict[str, Any]) -> dict[str, Any]:
    return {"dry_run": True, "command": command, "payload": redact(payload)}
