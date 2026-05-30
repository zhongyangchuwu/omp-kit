from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from scripts.import_skill import import_skill, is_url_like
from scripts.promote_skill import promote_skill
from scripts.resource_metadata import ResourceWorkflowError


def make_repo(tmp_path: Path) -> Path:
    repo = tmp_path / "repo"
    for name in ["skills", "extensions", "tools", "packages", "incoming", "localized"]:
        (repo / name).mkdir(parents=True)
    return repo


def make_source(tmp_path: Path, name: str = "alpha", *, skill_name: str | None = None) -> Path:
    source = tmp_path / "source" / name
    source.mkdir(parents=True)
    actual_skill_name = skill_name or name
    (source / "SKILL.md").write_text(
        f"---\nname: {actual_skill_name}\ndescription: test skill\n---\n\n# Test\n",
        encoding="utf-8",
    )
    (source / ".git").mkdir()
    (source / ".git" / "config").write_text("ignored", encoding="utf-8")
    return source


def load_yaml(path: Path) -> dict:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert isinstance(data, dict)
    return data


def test_import_skill_copies_local_directory_and_generates_metadata(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source = make_source(tmp_path, "alpha")

    destination = import_skill(source=source, name="alpha", repo_root=repo)

    assert destination == repo / "incoming" / "alpha"
    assert (destination / "SKILL.md").is_file()
    assert not (destination / ".git").exists()

    metadata = load_yaml(destination / "resource.yaml")
    assert metadata["name"] == "alpha"
    assert metadata["kind"] == "incoming"
    assert metadata["status"] == "staged"
    assert metadata["risk"]["level"] == "medium"
    assert metadata["activation"]["mode"] == "not-applicable"

    registry = load_yaml(repo / "registry.yaml")
    assert registry["incoming"]["alpha"] == {
        "status": "staged",
        "risk": "medium",
        "path": "incoming/alpha",
    }


def test_import_skill_rejects_existing_destination(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source = make_source(tmp_path, "alpha")
    (repo / "incoming" / "alpha").mkdir()

    with pytest.raises(ResourceWorkflowError, match="destination already exists"):
        import_skill(source=source, name="alpha", repo_root=repo)


def test_import_skill_rejects_url_like_sources() -> None:
    assert is_url_like("https://example.com/repo.git")
    assert is_url_like("git@example.com:repo.git")
    assert not is_url_like("../local/path")


def test_promote_skill_copies_incoming_to_active_skill(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source_input = make_source(tmp_path, "alpha")
    source = import_skill(source=source_input, name="alpha", repo_root=repo)

    destination = promote_skill(source=source, name="alpha", activation="manual", risk="low", repo_root=repo)

    assert destination == repo / "skills" / "alpha"
    assert (repo / "incoming" / "alpha" / "SKILL.md").is_file()
    assert (destination / "SKILL.md").is_file()

    metadata = load_yaml(destination / "resource.yaml")
    assert metadata["name"] == "alpha"
    assert metadata["kind"] == "skill"
    assert metadata["status"] == "active"
    assert metadata["path"] == "skills/alpha"
    assert metadata["risk"]["level"] == "low"
    assert metadata["activation"]["mode"] == "manual"
    assert metadata["source"]["origin"] == "incoming/alpha"

    registry = load_yaml(repo / "registry.yaml")
    assert registry["skills"]["alpha"] == {
        "status": "active",
        "risk": "low",
        "path": "skills/alpha",
    }
    assert registry["incoming"]["alpha"] == {
        "status": "staged",
        "risk": "medium",
        "path": "incoming/alpha",
    }


def test_promote_skill_rejects_missing_skill_md(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source = repo / "incoming" / "alpha"
    source.mkdir(parents=True)

    with pytest.raises(ResourceWorkflowError, match="SKILL.md missing"):
        promote_skill(source=source, name="alpha", activation="automatic", risk="medium", repo_root=repo)


def test_promote_skill_rejects_name_mismatch(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source = repo / "incoming" / "alpha"
    source.mkdir(parents=True)
    (source / "SKILL.md").write_text("---\nname: beta\ndescription: test\n---\n", encoding="utf-8")

    with pytest.raises(ResourceWorkflowError, match="does not match"):
        promote_skill(source=source, name="alpha", activation="automatic", risk="medium", repo_root=repo)


def test_promote_skill_rejects_existing_active_target(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source = repo / "incoming" / "alpha"
    source.mkdir(parents=True)
    (source / "SKILL.md").write_text("---\nname: alpha\ndescription: test\n---\n", encoding="utf-8")
    (repo / "skills" / "alpha").mkdir(parents=True)

    with pytest.raises(ResourceWorkflowError, match="destination already exists"):
        promote_skill(source=source, name="alpha", activation="automatic", risk="medium", repo_root=repo)


def test_promote_skill_rejects_sources_outside_quarantine(tmp_path: Path) -> None:
    repo = make_repo(tmp_path)
    source = repo / "other" / "alpha"
    source.mkdir(parents=True)
    (source / "SKILL.md").write_text("---\nname: alpha\ndescription: test\n---\n", encoding="utf-8")

    with pytest.raises(ResourceWorkflowError, match="incoming/ or localized"):
        promote_skill(source=source, name="alpha", activation="automatic", risk="medium", repo_root=repo)
