from __future__ import annotations

from autodl_skill.check import build_check_script


def test_build_check_script_reports_remote_workdir_tools_gpu_and_disk() -> None:
    script = build_check_script("/root/project")

    assert "printf 'remote_workdir=%s\\n' /root/project" in script
    assert "[ -d /root/project ]" in script
    assert "command -v tmux" in script
    assert "command -v nvidia-smi" in script
    assert "--query-gpu=name,utilization.gpu,memory.used,memory.total" in script
    assert "df -h /root/project" in script
