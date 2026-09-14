from __future__ import annotations

import shlex
import subprocess
from dataclasses import dataclass

from autodl_skill.ssh import SSHConfig, run_ssh_command
from autodl_skill.sync import validate_run_name


@dataclass(frozen=True)
class RemoteRunResult:
    returncode: int
    stdout: str
    stderr: str


def validate_log_name(log_name: str) -> None:
    if not log_name or "/" in log_name or ".." in log_name:
        raise ValueError("log name must be a single path segment")


def run_log_path(run_name: str, log_name: str) -> str:
    validate_run_name(run_name)
    validate_log_name(log_name)
    return f"outputs/runs/{run_name}/logs/{log_name}"


def run_status_path(run_name: str, log_name: str) -> str:
    return f"{run_log_path(run_name, log_name)}.status"


def build_logged_run_script(
    command_parts: list[str], *, run_name: str, log_name: str = "remote.log", session_name: str | None = None
) -> str:
    validate_run_name(run_name)
    validate_log_name(log_name)
    if session_name is not None:
        validate_run_name(session_name)
    if not command_parts:
        raise ValueError("run submit requires a command")

    session = session_name or run_name
    command = shlex.join(command_parts)
    log_path = run_log_path(run_name, log_name)
    status_path = run_status_path(run_name, log_name)
    log_dir = f"outputs/runs/{run_name}/logs"
    inner = (
        "set -euo pipefail; "
        f"mkdir -p {shlex.quote(log_dir)}; "
        "{ "
        "printf 'START %s\\n' \"$(date -Is)\"; "
        f"printf 'COMMAND %q\\n' {shlex.quote(command)}; "
        f"set +e; {command}; rc=$?; set -e; "
        "printf 'END %s rc=%s\\n' \"$(date -Is)\" \"$rc\"; "
        f"printf '%s\\n' \"$rc\" > {shlex.quote(status_path)}; "
        "exit \"$rc\"; "
        f"}} > {shlex.quote(log_path)} 2>&1"
    )
    return f"tmux new-session -d -s {shlex.quote(session)} -- bash -lc {shlex.quote(inner)}"


def build_status_script(run_name: str, *, log_name: str = "remote.log", log_lines: int = 5) -> str:
    validate_run_name(run_name)
    validate_log_name(log_name)
    line_count = max(log_lines, 0)
    log_path = run_log_path(run_name, log_name)
    status_path = run_status_path(run_name, log_name)
    return "; ".join(
        [
            f"printf 'run_name=%s\\n' {shlex.quote(run_name)}",
            f"printf 'tmux='; if tmux has-session -t {shlex.quote(run_name)} 2>/dev/null; then printf running; else printf stopped; fi; printf '\\n'",
            f"printf 'status_file='; if [ -f {shlex.quote(status_path)} ]; then tr -d '\\n' < {shlex.quote(status_path)}; else printf missing; fi; printf '\\n'",
            "printf 'gpu='; if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader; else printf unavailable; fi; printf '\\n'",
            f"printf 'log_path=%s\\n' {shlex.quote(log_path)}",
            f"if [ -f {shlex.quote(log_path)} ]; then printf 'log_head=\\n'; head -n {line_count} {shlex.quote(log_path)} | tr '\\r' '\\n' | sed -r 's/\\x1B\\[[0-9;?]*[A-Za-z]//g'; printf 'log_tail=\\n'; tail -n {line_count} {shlex.quote(log_path)} | tr '\\r' '\\n' | sed -r 's/\\x1B\\[[0-9;?]*[A-Za-z]//g'; else printf 'log=missing\\n'; fi",
        ]
    )


def build_tail_script(run_name: str, *, log_name: str = "remote.log", lines: int = 50) -> str:
    validate_run_name(run_name)
    validate_log_name(log_name)
    return f"tail -n {max(lines, 1)} {shlex.quote(run_log_path(run_name, log_name))}"


def build_kill_script(run_name: str) -> str:
    validate_run_name(run_name)
    return f"tmux kill-session -t {shlex.quote(run_name)}"


def run_remote_script(
    config: SSHConfig,
    script: str,
    *,
    remote_workdir: str,
    print_command: bool = False,
    timeout_seconds: float = 20.0,
) -> RemoteRunResult:
    completed: subprocess.CompletedProcess[str] = run_ssh_command(
        config,
        ["bash", "-lc", script],
        remote_workdir=remote_workdir,
        print_command=print_command,
        timeout_seconds=timeout_seconds,
    )
    return RemoteRunResult(
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )
