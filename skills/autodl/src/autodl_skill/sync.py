from __future__ import annotations

import shlex
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from autodl_skill.ssh import SSHConfig, redact_ssh_text


@dataclass(frozen=True)
class SyncResult:
    returncode: int
    stdout: str
    stderr: str


def validate_run_name(run_name: str) -> None:
    if not run_name or "/" in run_name or ".." in run_name:
        raise ValueError("run name must be a single path segment")


def remote_target(config: SSHConfig, remote_path: str) -> str:
    return f"{config.server}:{remote_path}"


def append_rsync_ssh_options(args: list[str], config: SSHConfig) -> None:
    if not config.port and config.key is None:
        return
    ssh_args = ["ssh"]
    if config.port:
        ssh_args.extend(["-p", config.port])
    if config.key is not None:
        ssh_args.extend(["-i", str(config.key)])
    args.extend(["--rsh", shlex.join(ssh_args)])


def base_rsync_args(*, dry_run: bool, quiet: bool) -> list[str]:
    args = ["rsync", "--archive", "--compress", "--human-readable", "--partial", "--progress"]
    if dry_run:
        args.extend(["--dry-run", "--itemize-changes"])
    elif quiet:
        args.append("--quiet")
    return args


def add_excludes(args: list[str], excludes: Iterable[str], exclude_from: Path | None) -> None:
    for pattern in excludes:
        args.append(f"--exclude={pattern}")
    if exclude_from is not None and exclude_from.exists():
        args.append(f"--exclude-from={exclude_from}")


def build_sync_up_args(
    config: SSHConfig,
    *,
    local_path: Path,
    remote_path: str,
    dry_run: bool = False,
    delete: bool = False,
    quiet: bool = True,
    excludes: Iterable[str] = (),
    exclude_from: Path | None = None,
) -> list[str]:
    args = base_rsync_args(dry_run=dry_run, quiet=quiet)
    add_excludes(args, excludes, exclude_from)
    if delete:
        args.append("--delete")
    append_rsync_ssh_options(args, config)
    args.extend([str(local_path), remote_target(config, remote_path)])
    return args


def build_down_run_args(
    config: SSHConfig,
    *,
    run_name: str,
    remote_workdir: str,
    local_outputs_root: Path,
    dry_run: bool = False,
    quiet: bool = True,
) -> list[str]:
    validate_run_name(run_name)
    args = base_rsync_args(dry_run=dry_run, quiet=quiet)
    append_rsync_ssh_options(args, config)
    remote_path = f"{remote_workdir.rstrip('/')}/outputs/runs/{run_name}/"
    local_path = local_outputs_root / run_name
    args.extend([remote_target(config, remote_path), str(local_path)])
    return args


def redacted_rsync_command(args: list[str], *, config: SSHConfig) -> str:
    command = shlex.join(args)
    command = redact_ssh_text(command, server=config.server, port=config.port, key=config.key)
    return "<rsync-command> " + command


def run_rsync(args: list[str], *, config: SSHConfig, print_command: bool = False) -> SyncResult:
    if print_command:
        return SyncResult(
            returncode=0,
            stdout=redacted_rsync_command(args, config=config),
            stderr="",
        )
    completed = subprocess.run(args, check=False, capture_output=True, text=True)
    return SyncResult(
        returncode=completed.returncode,
        stdout=redact_ssh_text(completed.stdout, server=config.server, port=config.port, key=config.key),
        stderr=redact_ssh_text(completed.stderr, server=config.server, port=config.port, key=config.key),
    )
