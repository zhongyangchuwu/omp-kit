from __future__ import annotations

from pathlib import Path

import yaml

from scripts.validate_registry import ALLOWED_GROUPS, parse_frontmatter, validate_registry

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "registry.yaml"


def load_registry() -> dict:
    data = yaml.safe_load(REGISTRY.read_text(encoding="utf-8"))
    assert isinstance(data, dict)
    return data


def test_registry_parseable() -> None:
    assert load_registry()


def test_registry_uses_allowed_groups_only() -> None:
    data = load_registry()
    assert set(data) <= ALLOWED_GROUPS


def test_registry_entries_have_minimal_required_fields() -> None:
    data = load_registry()
    required = {"path", "status", "risk"}
    for group, entries in data.items():
        assert isinstance(entries, dict), f"{group} must be a mapping"
        for name, entry in entries.items():
            missing = required - set(entry)
            assert not missing, f"{group}.{name} missing fields: {sorted(missing)}"


def test_registry_paths_exist_and_validate() -> None:
    issues = validate_registry(load_registry(), repo_root=ROOT)
    assert not issues, "\n".join(issue.format() for issue in issues)


def test_active_skill_frontmatter_name_matches_registry_key() -> None:
    data = load_registry()
    for name, entry in data.get("skills", {}).items():
        if entry.get("status") != "active":
            continue
        skill_md = ROOT / entry["path"] / "SKILL.md"
        frontmatter = parse_frontmatter(skill_md)
        assert frontmatter.get("name") == name
        assert frontmatter.get("description")


def test_staged_incoming_entries_are_not_active_skills() -> None:
    data = load_registry()
    active_skill_names = {
        path.name
        for path in (ROOT / "skills").iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    }
    for name, entry in data.get("incoming", {}).items():
        assert entry.get("status") == "staged"
        assert name not in active_skill_names
        assert not str(entry["path"]).startswith("skills/")


def test_omp_superpowers_remains_explicit_only() -> None:
    skill_md = ROOT / "skills" / "omp-superpowers" / "SKILL.md"
    text = skill_md.read_text(encoding="utf-8")

    assert "explicit-only" in text
    assert "explicitly asks" in text

    forbidden = [
        "MUST use this before any creative work",
        "before ANY response",
        "starting any conversation",
        "Invoke relevant or requested skills BEFORE any response",
    ]
    for pattern in forbidden:
        assert pattern not in text


def test_omp_superpowers_nested_skills_are_reference_only() -> None:
    data = load_registry()
    active_skill_names = set(data.get("skills", {}))
    sub_root = ROOT / "skills" / "omp-superpowers" / "references" / "skills"

    assert sub_root.is_dir()
    sub_skill_names = {
        path.name
        for path in sub_root.iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    }
    assert len(sub_skill_names) == 14
    assert not (sub_skill_names & active_skill_names)


def test_omp_superpowers_localization_notes_keep_omp_tooling() -> None:
    note = ROOT / "skills" / "omp-superpowers" / "references" / "omp-localization.md"
    text = note.read_text(encoding="utf-8")

    assert "Superpowers is explicit-only" in text
    assert "task" in text
    assert "todo_write" in text
    assert "Read tool" not in text
    assert "Skill tool" not in text
