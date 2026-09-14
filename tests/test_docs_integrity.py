"""Check real tracked documentation references without executing examples or services."""
from __future__ import annotations

from pathlib import Path
import re
import subprocess
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"\]\(([^\s)]+)(?:\s+\"[^\"]*\")?\)")
SUPPORT = re.compile(r"`((?:references|assets|docs)/[A-Za-z0-9_./-]+\.(?:md|json|yaml|toml|py))`")


def prose(text: str) -> str:
    lines: list[str] = []
    fence: str | None = None
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith(("```", "~~~")):
            marker = stripped[:3]
            if fence is None:
                fence = marker
            elif marker == fence:
                fence = None
            continue
        if fence is None:
            lines.append(line)
    return "\n".join(lines)


def tracked_markdown() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z", "--", "*.md"], cwd=ROOT,
        capture_output=True, check=True,
    )
    return [ROOT / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def test_current_markdown_relative_links_resolve() -> None:
    failures: list[str] = []
    for path in tracked_markdown():
        # Templates/evidence can describe external project layouts or immutable old trees.
        relative = path.relative_to(ROOT)
        if "assets" in relative.parts or relative.parts[0] == "evidence":
            continue
        for target in LINK.findall(prose(path.read_text(encoding="utf-8"))):
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", target) or target.startswith(("#", "/")):
                continue
            target = unquote(target.split("#", 1)[0].split("?", 1)[0])
            if not target or any(char in target for char in "<>*{}"):  # Explicit examples.
                continue
            if not (path.parent / target).exists():
                failures.append(f"{relative}: missing link {target}")
    assert not failures, "\n".join(failures)


def bundled_support_targets(skill: Path) -> list[str]:
    targets = SUPPORT.findall(prose(skill.read_text(encoding="utf-8")))
    # Bare docs/... in workflow prose describes the target project, not necessarily
    # a bundled Skill directory. Explicit Markdown links are checked above.
    return [target for target in targets
            if not target.startswith("docs/") or (skill.parent / "docs").is_dir()]


def test_skill_entrypoint_support_references_resolve() -> None:
    for path in sorted((ROOT / "skills").glob("*/SKILL.md")):
        for target in bundled_support_targets(path):
            assert (path.parent / target).is_file(), f"{path.relative_to(ROOT)}: missing {target}"


def test_support_targets_distinguish_project_docs_from_bundled_docs(tmp_path: Path) -> None:
    skill = tmp_path / "SKILL.md"
    skill.write_text("Use `docs/WORKING_STATE.md`, `references/missing.md` and `assets/test.json`.", encoding="utf-8")
    assert bundled_support_targets(skill) == ["references/missing.md", "assets/test.json"]
    (tmp_path / "docs").mkdir()
    assert bundled_support_targets(skill) == ["docs/WORKING_STATE.md", "references/missing.md", "assets/test.json"]


def test_distributed_design_and_experiment_assets_exist() -> None:
    assert (ROOT / "docs/design/README.md").is_file()
    assert (ROOT / "docs/design/context-authority.md").is_file()
    assert (ROOT / "evidence/README.md").is_file()
    assert list((ROOT / "evidence/experiments").glob("*/manifest.json"))
