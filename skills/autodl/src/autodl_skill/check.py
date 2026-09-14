from __future__ import annotations

import shlex
import shutil
import subprocess
from dataclasses import dataclass

from autodl_skill.ssh import SSHConfig, run_ssh_command


@dataclass(frozen=True)
class CheckResult:
    returncode: int
    stdout: str
    stderr: str


def local_rsync_available() -> bool:
    return shutil.which("rsync") is not None


def build_check_script(remote_workdir: str) -> str:
    quoted_workdir = shlex.quote(remote_workdir)
    return "; ".join(
        [
            f"printf 'remote_workdir=%s\\n' {quoted_workdir}",
            f"printf 'workdir='; if [ -d {quoted_workdir} ]; then printf ok; else printf missing; fi; printf '\\n'",
            "printf 'tmux='; if command -v tmux >/dev/null 2>&1; then printf ok; else printf missing; fi; printf '\\n'",
            "printf 'nvidia_smi='; if command -v nvidia-smi >/dev/null 2>&1; then printf ok; else printf missing; fi; printf '\\n'",
            "printf 'gpu='; if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader; else printf unavailable; fi; printf '\\n'",
            f"printf 'disk='; if [ -d {quoted_workdir} ]; then df -h {quoted_workdir} | tail -n 1; else df -h / | tail -n 1; fi",
        ]
    )


def run_check(
    config: SSHConfig,
    *,
    remote_workdir: str,
    print_command: bool = False,
    timeout_seconds: float = 20.0,
) -> CheckResult:
    completed: subprocess.CompletedProcess[str] = run_ssh_command(
        config,
        ["bash", "-lc", build_check_script(remote_workdir)],
        remote_workdir="/",
        print_command=print_command,
        timeout_seconds=timeout_seconds,
    )
    return CheckResult(
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
    )
