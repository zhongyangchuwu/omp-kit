from __future__ import annotations

import pytest

from autodl_skill.safety import ConfirmationError, require_confirmation, resource_plan, redact


def test_redact_masks_nested_secret_like_fields_case_insensitively() -> None:
    payload = {
        "Authorization": "Bearer secret",
        "nested": [
            {"password": "pw"},
            {"SSH_COMMAND": "ssh -p 10000 root@example"},
            {"safe": "visible"},
        ],
        "instance_uuid": "uuid-secret",
        "image_uuid": "image-secret",
    }

    redacted = redact(payload)

    assert redacted["Authorization"] == "<redacted>"
    assert redacted["nested"][0]["password"] == "<redacted>"
    assert redacted["nested"][1]["SSH_COMMAND"] == "<redacted>"
    assert redacted["nested"][2]["safe"] == "visible"
    assert redacted["instance_uuid"] == "<redacted>"
    assert redacted["image_uuid"] == "<redacted>"


def test_resource_plan_identifies_dry_run_by_default() -> None:
    plan = resource_plan("create-pro", confirm=False, yes_i_have_user_confirmation=False)

    assert plan.is_resource_change is True
    assert plan.dry_run is True
    assert plan.requires_user_confirmation is True


def test_create_pro_confirm_requires_user_confirmation_flag() -> None:
    with pytest.raises(ConfirmationError, match="explicit user confirmation"):
        require_confirmation("create-pro", confirm=True, yes_i_have_user_confirmation=False)


def test_power_start_confirm_requires_user_confirmation_flag() -> None:
    with pytest.raises(ConfirmationError, match="explicit user confirmation"):
        require_confirmation("power-pro start", confirm=True, yes_i_have_user_confirmation=False)


def test_power_stop_confirm_does_not_require_second_confirmation() -> None:
    require_confirmation("power-pro stop", confirm=True, yes_i_have_user_confirmation=False)


def test_release_confirm_requires_user_confirmation_flag() -> None:
    with pytest.raises(ConfirmationError, match="explicit user confirmation"):
        require_confirmation("release-pro", confirm=True, yes_i_have_user_confirmation=False)


def test_read_only_command_never_requires_confirmation() -> None:
    plan = resource_plan("status", confirm=False, yes_i_have_user_confirmation=False)
    require_confirmation("status", confirm=False, yes_i_have_user_confirmation=False)

    assert plan.is_resource_change is False
    assert plan.dry_run is False
    assert plan.requires_user_confirmation is False
