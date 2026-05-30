from __future__ import annotations

from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
ANTHROPIC = ROOT / "incoming" / "anthropic-skills"
REVIEW = ANTHROPIC / "review.yaml"

ALLOWED_DECISIONS = {
    "promoted",
    "promote-now",
    "localize-first",
    "defer-needs-tooling",
    "reject-or-reference-only",
}
ALLOWED_RISKS = {"low", "medium", "high"}


def load_review() -> dict:
    data = yaml.safe_load(REVIEW.read_text(encoding="utf-8"))
    assert isinstance(data, dict)
    return data


def test_anthropic_review_covers_every_skill_directory() -> None:
    review = load_review()
    reviewed = set(review["decisions"])
    actual = {
        path.name
        for path in (ANTHROPIC / "skills").iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    }
    assert reviewed == actual


def test_anthropic_review_decisions_are_valid() -> None:
    for name, item in load_review()["decisions"].items():
        assert item["decision"] in ALLOWED_DECISIONS, name
        assert item["risk"] in ALLOWED_RISKS, name
        assert item["reason"], name
        assert item["next_action"], name


def test_promoted_anthropic_skills_have_active_paths() -> None:
    for name, item in load_review()["decisions"].items():
        if item["decision"] != "promoted":
            continue
        active_path = ROOT / item["active_path"]
        localized_path = ROOT / item["localized_path"]
        assert active_path.is_dir(), name
        assert localized_path.is_dir(), name
        assert (active_path / "SKILL.md").is_file(), name
        assert (active_path / "resource.yaml").is_file(), name


def test_review_summary_matches_decisions() -> None:
    review = load_review()
    decisions = [item["decision"] for item in review["decisions"].values()]
    summary = review["summary"]

    assert summary["total_skills"] == len(decisions)
    assert summary["promoted"] == decisions.count("promoted")
    assert summary["promote_now"] == decisions.count("promote-now")
    assert summary["localize_first"] == decisions.count("localize-first")
    assert summary["defer_needs_tooling"] == decisions.count("defer-needs-tooling")
    assert summary["reject_or_reference_only"] == decisions.count("reject-or-reference-only")
