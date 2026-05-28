from __future__ import annotations

from pathlib import Path

import pytest

from scripts.link_skills import LinkError, link_skills


def make_skill(root: Path, name: str) -> Path:
    skill = root / "skills" / name
    skill.mkdir(parents=True)
    (skill / "SKILL.md").write_text(f"---\nname: {name}\ndescription: test\n---\n", encoding="utf-8")
    return skill


def test_links_each_skill_directory_under_agent_skills(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    source = make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agent"

    actions = link_skills(repo_root=repo, agent_root=target_root)

    link = target_root / "skills" / "alpha"
    assert link.is_symlink()
    assert link.resolve() == source.resolve()
    assert actions == [("linked", "alpha", source, link)]


def test_existing_correct_link_is_left_unchanged(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    source = make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agent"
    link_dir = target_root / "skills"
    link_dir.mkdir(parents=True)
    (link_dir / "alpha").symlink_to(source, target_is_directory=True)

    actions = link_skills(repo_root=repo, agent_root=target_root)

    assert actions == [("exists", "alpha", source, link_dir / "alpha")]
    assert (link_dir / "alpha").resolve() == source.resolve()


def test_refuses_to_replace_unrelated_existing_target_without_force(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agent"
    existing = target_root / "skills" / "alpha"
    existing.mkdir(parents=True)
    (existing / "note.txt").write_text("keep", encoding="utf-8")

    with pytest.raises(LinkError, match="already exists"):
        link_skills(repo_root=repo, agent_root=target_root)

    assert existing.is_dir()
    assert not existing.is_symlink()
    assert (existing / "note.txt").read_text(encoding="utf-8") == "keep"


def test_force_replaces_only_symlink_targets(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    source = make_skill(repo, "alpha")
    old = make_skill(tmp_path / "old_repo", "alpha")
    target_root = tmp_path / "home" / ".agent"
    link_dir = target_root / "skills"
    link_dir.mkdir(parents=True)
    target = link_dir / "alpha"
    target.symlink_to(old, target_is_directory=True)

    actions = link_skills(repo_root=repo, agent_root=target_root, force=True)

    assert target.is_symlink()
    assert target.resolve() == source.resolve()
    assert actions == [("relinked", "alpha", source, target)]


def test_force_still_refuses_to_replace_real_directory(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agent"
    existing = target_root / "skills" / "alpha"
    existing.mkdir(parents=True)

    with pytest.raises(LinkError, match="Refusing to replace non-symlink"):
        link_skills(repo_root=repo, agent_root=target_root, force=True)

    assert existing.is_dir()
    assert not existing.is_symlink()
