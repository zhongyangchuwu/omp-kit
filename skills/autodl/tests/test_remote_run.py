from __future__ import annotations

import pytest

from autodl_skill.remote_run import (
    build_kill_script,
    build_logged_run_script,
    build_status_script,
    build_tail_script,
    run_log_path,
)


def test_build_logged_run_script_uses_tmux_and_run_archive_logs() -> None:
    script = build_logged_run_script(
        ["uv", "run", "python", "scripts/train.py", "--run-name", "exp-a"],
        run_name="exp-a",
    )

    assert "tmux new-session -d -s exp-a" in script
    assert "outputs/runs/exp-a/logs/remote.log" in script
    assert "outputs/runs/exp-a/logs/remote.log.status" in script
    assert "COMMAND" in script


def test_build_logged_run_script_rejects_empty_command() -> None:
    with pytest.raises(ValueError, match="requires a command"):
        build_logged_run_script([], run_name="exp-a")


def test_build_logged_run_script_rejects_path_like_run_name() -> None:
    with pytest.raises(ValueError, match="single path segment"):
        build_logged_run_script(["hostname"], run_name="bad/name")


def test_status_script_reports_tmux_status_gpu_and_log_preview() -> None:
    script = build_status_script("exp-a", log_lines=3)

    assert "tmux has-session -t exp-a" in script
    assert "nvidia-smi" in script
    assert "outputs/runs/exp-a/logs/remote.log.status" in script
    assert "head -n 3" in script
    assert "tail -n 3" in script


def test_tail_and_kill_scripts_are_run_scoped() -> None:
    assert build_tail_script("exp-a", lines=10) == "tail -n 10 outputs/runs/exp-a/logs/remote.log"
    assert build_kill_script("exp-a") == "tmux kill-session -t exp-a"


def test_run_log_path_rejects_path_like_log_name() -> None:
    with pytest.raises(ValueError, match="single path segment"):
        run_log_path("exp-a", "../remote.log")
