from __future__ import annotations

from pathlib import Path

import pytest

from scripts.install_harness import InstallError, install_harness, link_agents, sync_config_file


def make_repo(root: Path) -> Path:
    (root / "skills" / "alpha").mkdir(parents=True)
    (root / "skills" / "alpha" / "SKILL.md").write_text(
        "---\nname: alpha\ndescription: test\n---\n", encoding="utf-8"
    )
    (root / "agents").mkdir()
    (root / "agents" / "worker.md").write_text("---\nname: worker\ndescription: test\n---\n", encoding="utf-8")
    (root / "config").mkdir()
    (root / "config" / "config.yml").write_text("modelRoles: {}\n", encoding="utf-8")
    (root / "config" / "models.yml").write_text("providers: {}\n", encoding="utf-8")
    return root


def test_link_agents_creates_per_file_symlink(tmp_path: Path) -> None:
    repo = make_repo(tmp_path / "repo")
    agent_root = tmp_path / "agent"

    actions = link_agents(repo_root=repo, agent_root=agent_root)

    target = agent_root / "agents" / "worker.md"
    assert target.is_symlink()
    assert target.resolve() == (repo / "agents" / "worker.md").resolve()
    assert actions[0].kind == "linked"


def test_link_agents_refuses_unmanaged_file_even_with_force(tmp_path: Path) -> None:
    repo = make_repo(tmp_path / "repo")
    agent_root = tmp_path / "agent"
    target = agent_root / "agents" / "worker.md"
    target.parent.mkdir(parents=True)
    target.write_text("keep\n", encoding="utf-8")

    with pytest.raises(InstallError, match="unmanaged agent"):
        link_agents(repo_root=repo, agent_root=agent_root, force=True)

    assert target.read_text(encoding="utf-8") == "keep\n"


def test_sync_config_refuses_drift_without_force(tmp_path: Path) -> None:
    source = tmp_path / "source.yml"
    target = tmp_path / "agent" / "config.yml"
    source.write_text("new: true\n", encoding="utf-8")
    target.parent.mkdir(parents=True)
    target.write_text("old: true\n", encoding="utf-8")

    with pytest.raises(InstallError, match="differs"):
        sync_config_file(source=source, target=target)

    assert target.read_text(encoding="utf-8") == "old: true\n"


def test_sync_config_force_backs_up_and_replaces(tmp_path: Path) -> None:
    source = tmp_path / "source.yml"
    target = tmp_path / "agent" / "config.yml"
    source.write_text("new: true\n", encoding="utf-8")
    target.parent.mkdir(parents=True)
    target.write_text("old: true\n", encoding="utf-8")

    action = sync_config_file(source=source, target=target, force=True)

    assert action.kind == "replaced"
    assert action.backup is not None
    assert action.backup.read_text(encoding="utf-8") == "old: true\n"
    assert target.read_text(encoding="utf-8") == "new: true\n"


def test_install_harness_installs_skills_agents_and_config(tmp_path: Path) -> None:
    repo = make_repo(tmp_path / "repo")
    agent_root = tmp_path / "agent"

    install_harness(repo_root=repo, agent_root=agent_root)

    assert (agent_root / "skills" / "alpha").is_symlink()
    assert (agent_root / "agents" / "worker.md").is_symlink()
    assert (agent_root / "config.yml").read_text(encoding="utf-8") == "modelRoles: {}\n"
    assert (agent_root / "models.yml").read_text(encoding="utf-8") == "providers: {}\n"
