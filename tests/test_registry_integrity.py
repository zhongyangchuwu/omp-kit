from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "registry.yaml"

# --- helpers ---

FM_PAT = re.compile(r"^---\n(.*?)\n---", re.DOTALL)
NAME_RE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


def load_registry():
    data = yaml.safe_load(REGISTRY.read_text(encoding="utf-8"))
    return data


def parse_frontmatter(path: Path):
    text = path.read_text(encoding="utf-8")
    m = FM_PAT.search(text)
    if not m:
        return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.startswith((" ", "-")):
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip().strip("\"'")
    return fm


# --- active-skills structural tests ---

def test_registry_parseable():
    assert load_registry() is not None


def test_active_skills_exist_and_kv_match():
    data = load_registry()
    for name, entry in data.get("skills", {}).items():
        if entry.get("status") != "active":
            continue
        path = ROOT / entry["path"]
        assert path.is_dir(), f"[{name}] path {entry['path']} not found"
        skill_md = path / "SKILL.md"
        assert skill_md.is_file(), f"[{name}] SKILL.md missing"
        fm = parse_frontmatter(skill_md)
        fm_name = fm.get("name")
        assert fm_name is not None, f"[{name}] frontmatter missing 'name'"
        assert fm_name == path.name, (
            f"[{name}] frontmatter name '{fm_name}' != directory '{path.name}'"
        )
        assert NAME_RE.fullmatch(fm_name), (
            f"[{name}] frontmatter name '{fm_name}' not valid kebab-case"
        )
        desc = fm.get("description", "")
        assert desc, f"[{name}] frontmatter description empty"
        assert len(desc) <= 1024, (
            f"[{name}] description too long ({len(desc)} > 1024)"
        )


def test_active_skills_have_required_registry_fields():
    data = load_registry()
    required = {"status", "risk", "reason", "path", "verification"}
    for name, entry in data.get("skills", {}).items():
        if entry.get("status") != "active":
            continue
        missing = required - set(entry)
        assert not missing, f"[{name}] missing registry fields: {missing}"


# --- explicit-only constraints ---

def test_explicit_only_skills_no_auto_trigger():
    data = load_registry()
    for name, entry in data.get("skills", {}).items():
        if not entry.get("explicit_only"):
            continue
        path = ROOT / entry["path"] / "SKILL.md"
        text = path.read_text(encoding="utf-8")
        auto_patterns = [
            "MUST use this before any creative work",
            "before ANY response",
            "starting any conversation",
            "Invoke relevant or requested skills BEFORE any response",
        ]
        for pat in auto_patterns:
            assert pat not in text, (
                f"[{name}] explicit_only skill contains auto-trigger pattern: {pat}"
            )


def test_explicit_only_skills_indicate_explicit_activation():
    data = load_registry()
    for name, entry in data.get("skills", {}).items():
        if not entry.get("explicit_only"):
            continue
        path = ROOT / entry["path"] / "SKILL.md"
        text = path.read_text(encoding="utf-8")
        explicit_markers = ["explicit-only", "explicitly asks"]
        found = any(marker in text for marker in explicit_markers)
        assert found, f"[{name}] explicit_only skill must mention activation policy"


# --- sub-skills encapsulation ---

def test_sub_skills_are_not_top_level():
    data = load_registry()
    top_skills = {
        p.name
        for p in (ROOT / "skills").iterdir()
        if p.is_dir() and (p / "SKILL.md").is_file()
    }
    for name, entry in data.get("skills", {}).items():
        if entry.get("status") != "active":
            continue
        if not entry.get("sub_skills_root"):
            continue
        sub_root = ROOT / entry["path"] / entry["sub_skills_root"]
        assert sub_root.is_dir(), f"[{name}] sub_skills_root not found: {entry['sub_skills_root']}"
        for sub in sub_root.iterdir():
            if sub.is_dir() and (sub / "SKILL.md").is_file():
                assert sub.name not in top_skills, (
                    f"[{name}] sub-skill '{sub.name}' must not be a top-level active skill"
                )


def test_sub_skills_count_matches_expected():
    data = load_registry()
    for name, entry in data.get("skills", {}).items():
        expected = entry.get("expected_sub_skills")
        if expected is None:
            continue
        sub_root = ROOT / entry["path"] / entry["sub_skills_root"]
        actual = sum(1 for p in sub_root.iterdir() if p.is_dir() and (p / "SKILL.md").is_file())
        assert actual == expected, (
            f"[{name}] expected {expected} sub-skills, found {actual}"
        )


# --- localization notes ---

def test_localization_notes_exist_and_match_constraints():
    data = load_registry()
    for name, entry in data.get("skills", {}).items():
        note_rel = entry.get("localization_note")
        if note_rel is None:
            continue
        note_path = ROOT / entry["path"] / note_rel
        assert note_path.is_file(), f"[{name}] localization note not found: {note_rel}"
        text = note_path.read_text(encoding="utf-8")
        for assertion in entry.get("localization_assertions", []):
            assert assertion in text, (
                f"[{name}] localization note missing assertion: '{assertion}'"
            )
        for anti in entry.get("localization_anti_patterns", []):
            assert anti not in text, (
                f"[{name}] localization note contains anti-pattern: '{anti}'"
            )


# --- incoming / staged ---

def test_staged_entries_exist_and_count_matches():
    data = load_registry()
    for name, entry in data.get("incoming", {}).items():
        if entry.get("status") != "staged":
            continue
        path = ROOT / entry["path"]
        assert path.is_dir(), f"[{name}] staged path not found: {entry['path']}"
        expected = entry.get("skill_count")
        if expected is not None:
            actual = sum(1 for p in path.rglob("SKILL.md"))
            assert actual == expected, (
                f"[{name}] expected {expected} SKILL.md files, found {actual}"
            )


def test_staged_entries_not_in_skills():
    top_skills = {
        p.name
        for p in (ROOT / "skills").iterdir()
        if p.is_dir() and (p / "SKILL.md").is_file()
    }
    for name in load_registry().get("incoming", {}):
        assert name not in top_skills, (
            f"[{name}] staged entry must not be in skills/"
        )
