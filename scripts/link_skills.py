from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Literal, TypeAlias

Action: TypeAlias = Literal["linked", "exists", "relinked"]
LinkAction: TypeAlias = tuple[Action, str, Path, Path]


class LinkError(RuntimeError):
    """Raised when a skill cannot be linked safely."""


def skill_dirs(repo_root: Path) -> list[Path]:
    skills_root = repo_root / "skills"
    if not skills_root.is_dir():
        raise LinkError(f"Skills directory not found: {skills_root}")

    return sorted(
        path
        for path in skills_root.iterdir()
        if path.is_dir() and (path / "SKILL.md").is_file()
    )


def link_skills(*, repo_root: Path, agent_root: Path, force: bool = False) -> list[LinkAction]:
    repo_root = repo_root.resolve()
    agent_root = agent_root.expanduser()
    target_root = agent_root / "skills"
    target_root.mkdir(parents=True, exist_ok=True)

    actions: list[LinkAction] = []
    for source in skill_dirs(repo_root):
        target = target_root / source.name
        source = source.resolve()

        if target.exists() or target.is_symlink():
            if target.is_symlink():
                if target.resolve() == source:
                    actions.append(("exists", source.name, source, target))
                    continue
                if force:
                    target.unlink()
                    target.symlink_to(source, target_is_directory=True)
                    actions.append(("relinked", source.name, source, target))
                    continue
                raise LinkError(
                    f"Target already exists and points elsewhere: {target} -> {target.resolve()}"
                )

            if force:
                raise LinkError(f"Refusing to replace non-symlink target: {target}")
            raise LinkError(f"Target already exists and is not a symlink: {target}")

        target.symlink_to(source, target_is_directory=True)
        actions.append(("linked", source.name, source, target))

    return actions


def default_repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Link repository skills into ~/.agent/skills")
    parser.add_argument(
        "--agent-root",
        type=Path,
        default=Path(os.environ.get("AGENT_ROOT", "~/.agent")),
        help="Agent config root to receive the skills directory; default: ~/.agent",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=default_repo_root(),
        help="Repository root containing skills/; default: this repository",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Replace existing symlinks that point elsewhere; never replaces real files or directories",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        actions = link_skills(repo_root=args.repo_root, agent_root=args.agent_root, force=args.force)
    except LinkError as exc:
        print(f"error: {exc}")
        return 1

    for action, name, source, target in actions:
        print(f"{action}: {name}: {target} -> {source}")
    if not actions:
        print("no skills found")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
