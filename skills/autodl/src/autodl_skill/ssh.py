from __future__ import annotations

import shlex
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SSHConfig:
    server: str
    port: str | None = None
    key: Path | None = None


def build_remote_repo_command(command_parts: list[str], *, remote_workdir: str) -> str:
    command = shlex.join(command_parts)
    quoted_workdir = shlex.quote(remote_workdir)
    return (
        "export PATH=/root/miniconda3/bin:/root/.local/bin:/usr/local/bin:$PATH; "
        f"cd {quoted_workdir} && {command}"
    )


def build_ssh_args(config: SSHConfig, remote_command: str) -> list[str]:
    args = ["ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=accept-new"]
    if config.key is not None:
        args.extend(["-i", str(config.key)])
    if config.port:
        args.extend(["-p", config.port])
    args.extend([config.server, remote_command])
    return args


def redact_ssh_text(text: str, *, server: str, port: str | None, key: Path | None = None) -> str:
    redacted = text.replace(server, "<ssh-server>")
    if port:
        redacted = redacted.replace(port, "<ssh-port>")
    if key is not None:
        redacted = redacted.replace(str(key), "<ssh-key>")
    return redacted


def redacted_ssh_command(args: list[str], *, server: str, port: str | None, key: Path | None = None) -> str:
    command = shlex.join(args)
    command = redact_ssh_text(command, server=server, port=port, key=key)
    return "<ssh-command> " + command


def run_ssh_command(
    config: SSHConfig,
    command_parts: list[str],
    *,
    remote_workdir: str,
    print_command: bool = False,
    timeout_seconds: float = 20.0,
) -> subprocess.CompletedProcess[str]:
    remote_command = build_remote_repo_command(command_parts, remote_workdir=remote_workdir)
    args = build_ssh_args(config, remote_command)
    if print_command:
        return subprocess.CompletedProcess(
            args=args,
            returncode=0,
            stdout=redacted_ssh_command(args, server=config.server, port=config.port, key=config.key),
            stderr="",
        )
    completed = subprocess.run(args, check=False, capture_output=True, text=True, timeout=timeout_seconds)
    return subprocess.CompletedProcess(
        args=completed.args,
        returncode=completed.returncode,
        stdout=redact_ssh_text(completed.stdout, server=config.server, port=config.port, key=config.key),
        stderr=redact_ssh_text(completed.stderr, server=config.server, port=config.port, key=config.key),
    )
