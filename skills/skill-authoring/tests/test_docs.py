from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORTABLE_REFERENCES = [
    "references/agent-skills-standard.md",
    "references/authoring-rubric.md",
    "references/description-guide.md",
    "references/evaluation-guide.md",
    "references/scripts-guide.md",
    "references/maintenance-guide.md",
    "references/third-party-review.md",
    "references/resource-metadata.md",
    "references/registry-generation.md",
]
RUNTIME_REFERENCES = [
    "references/runtimes/README.md",
    "references/runtimes/claude.md",
    "references/runtimes/codex.md",
    "references/runtimes/npx-skills.md",
    "references/runtimes/oh-my-pi.md",
]
ASSETS = [
    "assets/skill-template.md",
    "assets/evals-template.json",
    "assets/maintenance-notes-template.md",
    "assets/resource-template.yaml",
]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"---\n(.*?)\n---", text, re.DOTALL)
    assert match, "SKILL.md must start with YAML frontmatter"
    fields: dict[str, str] = {}
    for line in match.group(1).splitlines():
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()
    return fields


def test_skill_uses_portable_frontmatter_only() -> None:
    fields = frontmatter(read("SKILL.md"))

    assert fields["name"] == "skill-authoring"
    assert set(fields) == {"name", "description"}
    assert "Create" in fields["description"]
    assert "maintain" in fields["description"]
    assert "portable Agent Skills" in fields["description"]
    assert len(fields["description"]) <= 1024


def test_skill_links_all_guides_and_templates() -> None:
    text = read("SKILL.md")

    for relative in [*PORTABLE_REFERENCES, *RUNTIME_REFERENCES, *ASSETS]:
        assert relative in text

    required_phrases = [
        "portable by default",
        "runtime-specific",
        "progressive disclosure",
        "skills-ref validate",
        "create, update, review, evaluate, maintain, or archive",
    ]
    for phrase in required_phrases:
        assert phrase in text


def test_standard_guide_contains_portable_agent_skills_rules() -> None:
    text = read("references/agent-skills-standard.md")

    required_phrases = [
        "SKILL.md",
        "scripts/",
        "references/",
        "assets/",
        "progressive disclosure",
        "skills-ref validate",
        "name must match the parent directory",
        "lowercase letters, numbers, and hyphens",
    ]
    for phrase in required_phrases:
        assert phrase in text


def test_runtime_specific_terms_are_isolated() -> None:
    portable_text = "\n".join(read(path) for path in PORTABLE_REFERENCES)
    runtime_text = "\n".join(read(path) for path in RUNTIME_REFERENCES)

    runtime_terms = [
        "Claude Code",
        "$skill-creator",
        "/skill:<name>",
        "skill://",
        "alwaysApply",
        "globs",
        "npx skills",
    ]
    for term in runtime_terms:
        assert term not in portable_text
        assert term in runtime_text


def test_templates_cover_skill_evals_maintenance_and_resources() -> None:
    skill_template = read("assets/skill-template.md")
    evals_template = read("assets/evals-template.json")
    notes_template = read("assets/maintenance-notes-template.md")
    resource_template = read("assets/resource-template.yaml")

    assert "name: skill-name" in skill_template
    assert "description:" in skill_template
    assert "## When to Use" in skill_template
    assert '"skill_name"' in evals_template
    assert '"assertions"' in evals_template
    assert "# Maintenance Notes" in notes_template
    assert "Quality checklist" in notes_template
    assert "kind: skill" in resource_template
    assert "relationships:" in resource_template
    assert "verification:" in resource_template


def test_no_missing_relative_links() -> None:
    markdown_files = [ROOT / "SKILL.md", *ROOT.glob("references/**/*.md")]
    link_pattern = re.compile(r"\]\(([^)#]+)(?:#[^)]+)?\)")

    for path in markdown_files:
        text = path.read_text(encoding="utf-8")
        for target in link_pattern.findall(text):
            if "://" in target or target.startswith("#"):
                continue
            resolved = (path.parent / target).resolve()
            assert resolved.exists(), f"{path.relative_to(ROOT)} links missing file {target}"
