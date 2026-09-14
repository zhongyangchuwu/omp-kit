from __future__ import annotations

from pathlib import Path

import pytest

from autodl_skill.ssh import SSHConfig
from autodl_skill.sync import build_down_run_args, build_sync_up_args, redacted_rsync_command


def test_build_sync_up_args_uses_rsync_over_configured_ssh(tmp_path: Path) -> None:
    key = tmp_path / "id_autodl"
    config = SSHConfig(server="root@example.com", port="10000", key=key)

    args = build_sync_up_args(
        config,
        local_path=Path("."),
        remote_path="/root/project",
        dry_run=True,
        delete=True,
        excludes=(".git/", "outputs/"),
        exclude_from=None,
    )

    assert args[0] == "rsync"
    assert "--dry-run" in args
    assert "--delete" in args
    assert "--exclude=.git/" in args
    assert "--exclude=outputs/" in args
    assert "--rsh" in args
    assert "-p 10000" in args[args.index("--rsh") + 1]
    assert str(key) in args[args.index("--rsh") + 1]
    assert args[-2:] == [".", "root@example.com:/root/project"]


def test_build_down_run_args_pulls_one_named_run_archive() -> None:
    config = SSHConfig(server="root@example.com", port=None, key=None)

    args = build_down_run_args(
        config,
        run_name="exp-a",
        remote_workdir="/root/project/",
        local_outputs_root=Path("outputs/runs"),
    )

    assert args[-2:] == [
        "root@example.com:/root/project/outputs/runs/exp-a/",
        "outputs/runs/exp-a",
    ]


def test_build_down_run_args_rejects_path_like_run_name() -> None:
    config = SSHConfig(server="root@example.com")

    with pytest.raises(ValueError, match="single path segment"):
        build_down_run_args(
            config,
            run_name="../secret",
            remote_workdir="/root/project",
            local_outputs_root=Path("outputs/runs"),
        )


def test_redacted_rsync_command_hides_connection_values() -> None:
    config = SSHConfig(server="root@example.com", port="10000", key=None)
    command = redacted_rsync_command(
        ["rsync", "root@example.com:/root/project/outputs/runs/exp/", "outputs/runs/exp"],
        config=config,
    )

    assert "root@example.com" not in command
    assert "10000" not in command
    assert "<ssh-server>" in command
    assert command.startswith("<rsync-command>")
