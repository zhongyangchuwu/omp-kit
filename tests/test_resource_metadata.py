from __future__ import annotations

from pathlib import Path

import yaml

from scripts.resource_metadata import (
    ALLOWED_ACTIVATION_MODES,
    ALLOWED_KINDS,
    ALLOWED_RISKS,
    ALLOWED_STATUSES,
    REGISTRY_HEADER,
    build_registry,
    discover_resources,
    format_registry,
    validate_resources,
)
from scripts.validate_registry import parse_frontmatter

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "registry.yaml"


def resources():
    return discover_resources(ROOT)


def test_resource_metadata_files_validate() -> None:
    issues = validate_resources(resources(), repo_root=ROOT)
    assert not issues, "\n".join(issue.format() for issue in issues)


def test_every_registry_resource_has_resource_yaml() -> None:
    discovered = {(resource.kind, resource.name) for resource in resources()}
    registry = yaml.safe_load(REGISTRY.read_text(encoding="utf-8"))
    expected = set()
    for group, kind in {
        "skills": "skill",
        "extensions": "extension",
        "tools": "tool",
        "packages": "package",
        "incoming": "incoming",
        "imports": "import",
    }.items():
        for name in registry.get(group, {}):
            expected.add((kind, name))
    assert discovered == expected


def test_resource_allowed_values_are_explicit() -> None:
    for resource in resources():
        data = resource.data
        assert data["kind"] in ALLOWED_KINDS
        assert data["status"] in ALLOWED_STATUSES
        assert data["risk"]["level"] in ALLOWED_RISKS
        assert data["activation"]["mode"] in ALLOWED_ACTIVATION_MODES


def test_generated_registry_matches_committed_registry() -> None:
    generated = format_registry(build_registry(resources()))
    assert generated == REGISTRY.read_text(encoding="utf-8")


def test_registry_has_generated_header() -> None:
    assert REGISTRY.read_text(encoding="utf-8").startswith(REGISTRY_HEADER)


def test_active_skill_resources_match_skill_frontmatter() -> None:
    for resource in resources():
        if resource.kind != "skill" or resource.status != "active":
            continue
        skill_md = ROOT / resource.path / "SKILL.md"
        frontmatter = parse_frontmatter(skill_md)
        assert frontmatter.get("name") == resource.name
        assert frontmatter.get("description")


def test_omp_superpowers_resource_records_explicit_only_activation() -> None:
    superpowers = next(resource for resource in resources() if resource.name == "omp-superpowers")
    assert superpowers.data["activation"]["mode"] == "explicit-only"
    assert "explicitly asks" in superpowers.data["activation"]["notes"]


def test_generated_registry_yaml_is_minimal() -> None:
    registry = yaml.safe_load(REGISTRY.read_text(encoding="utf-8"))
    for entries in registry.values():
        assert isinstance(entries, dict)
        for entry in entries.values():
            assert set(entry) == {"status", "risk", "path"}
