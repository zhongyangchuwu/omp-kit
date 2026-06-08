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
    target_root = tmp_path / "home" / ".agents"

    actions = link_skills(repo_root=repo, agent_root=target_root)

    link = target_root / "skills" / "alpha"
    assert link.is_symlink()
    assert link.resolve() == source.resolve()
    assert actions == [("linked", "alpha", source.resolve(), link)]


def test_existing_correct_link_is_left_unchanged(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    source = make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agents"
    link_dir = target_root / "skills"
    link_dir.mkdir(parents=True)
    link = link_dir / "alpha"
    link.symlink_to(source, target_is_directory=True)

    actions = link_skills(repo_root=repo, agent_root=target_root)

    assert actions == [("exists", "alpha", source.resolve(), link)]
    assert link.resolve() == source.resolve()


def test_refuses_to_replace_unrelated_existing_target_without_force(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agents"
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
    target_root = tmp_path / "home" / ".agents"
    link_dir = target_root / "skills"
    link_dir.mkdir(parents=True)
    target = link_dir / "alpha"
    target.symlink_to(old, target_is_directory=True)

    actions = link_skills(repo_root=repo, agent_root=target_root, force=True)

    assert target.is_symlink()
    assert target.resolve() == source.resolve()
    assert actions == [("relinked", "alpha", source.resolve(), target)]


def test_force_still_refuses_to_replace_real_directory(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agents"
    existing = target_root / "skills" / "alpha"
    existing.mkdir(parents=True)

    with pytest.raises(LinkError, match="Refusing to replace non-symlink"):
        link_skills(repo_root=repo, agent_root=target_root, force=True)

    assert existing.is_dir()
    assert not existing.is_symlink()


def test_ignores_draft_skill_directories(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    active = make_skill(repo, "alpha")
    draft = repo / "drafts" / "beta"
    draft.mkdir(parents=True)
    (draft / "SKILL.md").write_text("---\nname: beta\ndescription: draft\n---\n", encoding="utf-8")
    target_root = tmp_path / "home" / ".agents"

    actions = link_skills(repo_root=repo, agent_root=target_root)

    assert actions == [("linked", "alpha", active.resolve(), target_root / "skills" / "alpha")]
    assert not (target_root / "skills" / "beta").exists()


def test_force_prunes_obsolete_current_skills_symlink(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    (repo / "skills").mkdir(parents=True)
    old = repo / "skills" / "old-name"
    old.mkdir()
    (old / "SKILL.md").write_text("---\nname: old-name\ndescription: old\n---\n", encoding="utf-8")
    old.rename(repo / "skills" / "renamed")
    target_root = tmp_path / "home" / ".agents"
    link_dir = target_root / "skills"
    link_dir.mkdir(parents=True)
    target = link_dir / "old-name"
    target.symlink_to(repo / "skills" / "renamed", target_is_directory=True)

    actions = link_skills(repo_root=repo, agent_root=target_root, force=True, prune=True)

    assert actions == [
        ("removed", "old-name", (repo / "skills" / "renamed").resolve(), target),
        ("linked", "renamed", (repo / "skills" / "renamed").resolve(), link_dir / "renamed"),
    ]
    assert not target.exists()
    assert (link_dir / "renamed").resolve() == (repo / "skills" / "renamed").resolve()


def test_force_replaces_parent_skills_symlink_with_per_skill_links(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    source = make_skill(repo, "alpha")
    target_root = tmp_path / "home" / ".agents"
    target_root.mkdir(parents=True)
    target_root.joinpath("skills").symlink_to(repo / "skills", target_is_directory=True)

    actions = link_skills(repo_root=repo, agent_root=target_root, force=True)

    link = target_root / "skills" / "alpha"
    assert actions == [
        ("removed", "skills", (repo / "skills").resolve(), target_root / "skills"),
        ("linked", "alpha", source.resolve(), link),
    ]
    assert link.is_symlink()
    assert link.resolve() == source.resolve()
