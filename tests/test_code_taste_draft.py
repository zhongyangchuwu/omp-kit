from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE_TASTE = ROOT / "drafts" / "code-taste"


def read_text(relative: str) -> str:
    return (CODE_TASTE / relative).read_text(encoding="utf-8")


def test_code_taste_prefers_contract_tests_over_white_box_coverage() -> None:
    skill = read_text("SKILL.md")
    testing = read_text("references/testing-taste.md")

    assert "black-box contract tests" in skill
    assert "exhaustive internal tests" in skill
    assert "Default to black-box contract tests" in testing
    assert "White-box tests are lower priority" in testing
    assert "White-box exceptions" in testing


def test_code_taste_encourages_mvp_refactoring_with_contract_verification() -> None:
    skill = read_text("SKILL.md")
    abstractions = read_text("references/abstraction-rules.md")
    checklist = read_text("references/review-checklist.md")

    assert "do not fear behavior-preserving refactors" in skill
    assert "Git rollback reduces the cost of failed refactors" in abstractions
    assert "verify exposed contracts" in abstractions
    assert "bias toward fast iteration" in checklist
    assert "Escalate rigor" in checklist
