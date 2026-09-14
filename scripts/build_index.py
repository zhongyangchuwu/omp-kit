from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

try:
    from scripts.validate_registry import ALLOWED_GROUPS, load_registry
except ModuleNotFoundError:  # direct execution: python scripts/build_index.py
    from validate_registry import ALLOWED_GROUPS, load_registry

GROUP_ORDER = ["skills", "drafts"]


def default_repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def format_group_name(group: str) -> str:
    return group.replace("-", " ").title()


def build_index(data: dict[str, Any]) -> str:
    lines: list[str] = []
    for group in GROUP_ORDER:
        entries = data.get(group, {})
        if entries is None:
            entries = {}
        if not isinstance(entries, dict):
            continue

        lines.append(format_group_name(group))
        if not entries:
            lines.append("- none")
        else:
            for name in sorted(entries):
                entry = entries[name]
                if isinstance(entry, dict):
                    status = entry.get("status", "unknown")
                    risk = entry.get("risk", "unknown")
                    path = entry.get("path", "unknown")
                    lines.append(f"- {name} [{status}/{risk}] {path}")
                else:
                    lines.append(f"- {name} [invalid] unknown")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Print a compact human-readable index from registry.yaml")
    parser.add_argument("registry", nargs="?", type=Path, default=default_repo_root() / "registry.yaml")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    data = load_registry(args.registry)
    unknown = set(data) - ALLOWED_GROUPS
    if unknown:
        print(f"warning: ignoring unknown groups: {', '.join(sorted(unknown))}")
    print(build_index(data), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
