from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_skill_links_to_existing_server_best_practices_reference() -> None:
    reference = "docs/server-best-practices.md"
    text = read("SKILL.md")

    assert reference in text
    assert (ROOT / reference).is_file()
