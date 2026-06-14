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


def test_draft_entries_are_not_linked_from_active_skills() -> None:
    data = load_registry()
    for _name, entry in data.get("drafts", {}).items():
        assert entry.get("status") == "draft"
        assert str(entry["path"]).startswith("drafts/")


def test_nested_reference_skills_are_not_registered_as_active_resources() -> None:
    data = load_registry()
    active_skill_names = set(data.get("skills", {}))

    for skill_dir in (ROOT / "skills").iterdir():
        sub_root = skill_dir / "references" / "skills"
        if not sub_root.is_dir():
            continue

        sub_skill_names = {
            path.name
            for path in sub_root.iterdir()
            if path.is_dir() and (path / "SKILL.md").is_file()
        }
        assert not (sub_skill_names & active_skill_names)
