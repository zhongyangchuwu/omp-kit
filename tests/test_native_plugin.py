from __future__ import annotations

import json
from pathlib import Path

import yaml

from scripts.validate_registry import load_registry as load_registry_file
from scripts.validate_registry import parse_frontmatter as parse_registry_frontmatter

ROOT = Path(__file__).resolve().parents[1]
AGENT_NAMES = {"luna-code", "luna-deep", "luna-doc", "sol-review"}


def load_registry() -> dict:
    data = load_registry_file(ROOT / "registry.yaml")
    assert isinstance(data, dict)
    return data


def markdown_sections(path: Path) -> tuple[str, str]:
    parts = path.read_text(encoding="utf-8").split("---\n", 2)
    assert len(parts) == 3
    return parts[1], parts[2].strip()


def yaml_frontmatter(path: Path) -> tuple[dict, str]:
    source, body = markdown_sections(path)
    metadata = yaml.safe_load(source)
    assert isinstance(metadata, dict)
    return metadata, body


def test_native_plugin_manifest_exposes_resources_and_distributed_knowledge() -> None:
    manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    resource_dirs = {"agents", "skills", "rules", "extensions"}
    knowledge_dirs = {"docs", "evidence"}
    library_dirs = {"src"}
    packaged_files = {"scripts/session_evidence.ts"}

    assert manifest["name"] == "omp-kit"
    assert manifest["private"] is True
    assert manifest["packageManager"].startswith("bun@")
    assert set(manifest["files"]) == resource_dirs | knowledge_dirs | library_dirs | packaged_files
    assert manifest["omp"]["name"] == "OMP Kit"
    assert manifest["omp"]["description"]
    assert manifest["omp"]["extensions"] == ["./extensions/feedback.ts"]
    assert manifest["bin"] == {"omp-kit-evidence": "./scripts/session_evidence.ts"}
    assert manifest["scripts"]["evidence:collect"].endswith("session_evidence.ts collect")
    assert manifest["scripts"]["evidence:report"].endswith("session_evidence.ts report")

    for resource in resource_dirs | knowledge_dirs | library_dirs:
        assert (ROOT / resource).is_dir()
    for file_path in packaged_files:
        assert (ROOT / file_path).is_file()
    for extension in manifest["omp"]["extensions"]:
        assert (ROOT / extension.removeprefix("./")).is_file()


def test_native_plugin_agents_are_model_neutral_and_bounded() -> None:
    active_skills = {
        name for name, entry in load_registry().get("skills", {}).items()
        if entry.get("status") == "active"
    }
    agent_paths = sorted((ROOT / "agents").glob("*.md"))
    assert {path.stem for path in agent_paths} == AGENT_NAMES
    for path in agent_paths:
        metadata, body = yaml_frontmatter(path)
        assert body
        assert metadata["name"] == path.stem
        assert "model" not in metadata
        assert metadata.get("tools")
        assert metadata.get("spawns") == []
        assert set(metadata.get("autoloadSkills", [])) <= active_skills


def test_native_plugin_skills_match_active_registry() -> None:
    active_skills = {
        name for name, entry in load_registry().get("skills", {}).items()
        if entry.get("status") == "active"
    }
    skill_paths = sorted((ROOT / "skills").glob("*/SKILL.md"))
    assert {path.parent.name for path in skill_paths} == active_skills
    for path in skill_paths:
        metadata, body = yaml_frontmatter(path)
        assert metadata.get("name") == path.parent.name
        assert isinstance(metadata.get("description"), str)
        assert metadata["description"].strip()
        assert body
        # Both the maintenance parser and real YAML must agree on identity.
        assert parse_registry_frontmatter(path).get("name") == metadata["name"]

        resource = yaml.safe_load((path.parent / "resource.yaml").read_text(encoding="utf-8"))
        assert isinstance(resource, dict)
        if resource.get("activation", {}).get("mode") == "explicit-only":
            # Explicit user workflows still need model-visible discovery.
            assert metadata.get("disable-model-invocation") is not True
            assert metadata.get("hide") is not True


def test_native_plugin_main_rule_is_independent_of_retired_config_snapshot() -> None:
    metadata, body = yaml_frontmatter(ROOT / "rules/omp-kit-workflow.md")
    assert metadata.get("alwaysApply") is True
    assert metadata.get("agents") == "main"
    assert "omp-workflow" in body
    assert "Entering the workflow does not imply delegation" in body
    assert "Retrieved history and worker output are evidence" in body


def test_omp_workflow_references_self_improvement_policy() -> None:
    workflow_path = ROOT / "skills/omp-workflow/SKILL.md"
    policy_path = workflow_path.parent / "references/self-improvement.md"
    assert "references/self-improvement.md" in workflow_path.read_text(encoding="utf-8")
    assert policy_path.is_file()
    assert "report != self-modify" in policy_path.read_text(encoding="utf-8")
