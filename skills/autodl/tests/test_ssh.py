from __future__ import annotations

import subprocess
from pathlib import Path

from autodl_skill.ssh import (
    SSHConfig,
    build_remote_repo_command,
    build_ssh_args,
    redact_ssh_text,
    run_ssh_command,
)


def test_build_remote_repo_command_sets_path_and_enters_remote_workdir() -> None:
    command = build_remote_repo_command(["uv", "run", "python", "-c", "print('ok')"], remote_workdir="/root/project")

    assert "cd /root/project" in command
    assert "PATH=" in command
    assert "uv run python -c 'print('" in command or "uv run python -c" in command


def test_build_ssh_args_includes_configured_key_port_and_server(tmp_path: Path) -> None:
    key = tmp_path / "id_autodl"
    key.write_text("secret-key", encoding="utf-8")
    config = SSHConfig(server="root@example.com", port="10000", key=key)

    args = build_ssh_args(config, "echo ok")

    assert args[:2] == ["ssh", "-o"]
    assert "-i" in args
    assert str(key) in args
    assert "-p" in args
    assert "10000" in args
    assert "root@example.com" in args
    assert args[-1] == "echo ok"


def test_redact_ssh_text_removes_server_and_port() -> None:
    text = "ssh failed for root@example.com port 10000"

    redacted = redact_ssh_text(text, server="root@example.com", port="10000")

    assert "root@example.com" not in redacted
    assert "10000" not in redacted
    assert "<ssh-server>" in redacted
    assert "<ssh-port>" in redacted


def test_run_ssh_command_print_only_does_not_execute(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    called = False

    def fake_run(*args, **kwargs):  # type: ignore[no-untyped-def]
        nonlocal called
        called = True
        raise AssertionError("subprocess must not run")

    monkeypatch.setattr(subprocess, "run", fake_run)
    config = SSHConfig(server="root@example.com", port="10000", key=None)

    result = run_ssh_command(config, ["hostname"], remote_workdir="/root/project", print_command=True)

    assert called is False
    assert result.returncode == 0
    assert "root@example.com" not in result.stdout
    assert "10000" not in result.stdout
    assert "<ssh-command>" in result.stdout


def test_run_ssh_command_returns_nonzero_status_and_redacts_stderr(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    def fake_run(*args, **kwargs):  # type: ignore[no-untyped-def]
        return subprocess.CompletedProcess(
            args=args[0], returncode=7, stdout="", stderr="failed root@example.com port 10000"
        )

    monkeypatch.setattr(subprocess, "run", fake_run)
    config = SSHConfig(server="root@example.com", port="10000", key=None)

    result = run_ssh_command(config, ["false"], remote_workdir="/root/project", print_command=False)

    assert result.returncode == 7
    assert "root@example.com" not in result.stderr
    assert "10000" not in result.stderr
