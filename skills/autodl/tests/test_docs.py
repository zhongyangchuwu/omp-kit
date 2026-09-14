from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def test_best_practices_captures_autodl_server_operational_lessons() -> None:
    text = read("docs/server-best-practices.md")

    required_phrases = [
        "/root/autodl-tmp",
        "stop vs release",
        "create-pro starts billing immediately",
        "snapshot",
        "SSH_SERVER",
        "SSH_PORT",
        "nvidia-smi",
        "tmux or screen",
        "remote.log",
        "logs/progress.jsonl",
        "uv cache",
        "No space left on device",
        "SDPA",
        "FlashAttention2",
        "smoke",
        "power off before asking a blocking question",
    ]
    for phrase in required_phrases:
        assert phrase in text


def test_skill_links_to_server_best_practices() -> None:
    text = read("SKILL.md")

    assert "docs/server-best-practices.md" in text
    assert "Server Best Practices" in text
