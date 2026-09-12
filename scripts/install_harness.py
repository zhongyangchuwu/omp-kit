from __future__ import annotations

import argparse
import os
import shutil
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

try:
    from scripts.link_skills import LinkError, link_skills
except ModuleNotFoundError:  # direct execution from scripts/
    from link_skills import LinkError, link_skills


class InstallError(RuntimeError):
    """Raised when harness installation would overwrite unmanaged state."""


@dataclass(frozen=True)
class Action:
    kind: str
    target: Path
    source: Path | None = None
    backup: Path | None = None

    def format(self) -> str:
        detail = f" <- {self.source}" if self.source is not None else ""
        if self.backup is not None:
            detail += f" (backup: {self.backup})"
        return f"{self.kind}: {self.target}{detail}"


def agent_files(repo_root: Path) -> list[Path]:
    root = repo_root / "agents"
    if not root.exists():
        return []
    if not root.is_dir():
        raise InstallError(f"Agents path is not a directory: {root}")
    return sorted(path for path in root.glob("*.md") if path.is_file())


def link_agents(*, repo_root: Path, agent_root: Path, force: bool = False) -> list[Action]:
    sources = agent_files(repo_root)
    target_root = agent_root / "agents"
    target_root.mkdir(parents=True, exist_ok=True)
    actions: list[Action] = []

    for source in sources:
        source = source.resolve()
        target = target_root / source.name
        if target.exists() or target.is_symlink():
            if target.is_symlink() and target.resolve() == source:
                actions.append(Action("exists", target, source))
                continue
            if target.is_symlink() and force:
                target.unlink()
                target.symlink_to(source)
                actions.append(Action("relinked", target, source))
                continue
            raise InstallError(f"Refusing to replace unmanaged agent target: {target}")

        target.symlink_to(source)
        actions.append(Action("linked", target, source))

    return actions


def _same_content(source: Path, target: Path) -> bool:
    return target.is_file() and not target.is_symlink() and source.read_bytes() == target.read_bytes()


def _backup_path(target: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    candidate = target.with_name(f"{target.name}.bak-{stamp}")
    counter = 1
    while candidate.exists() or candidate.is_symlink():
        candidate = target.with_name(f"{target.name}.bak-{stamp}-{counter}")
        counter += 1
    return candidate


def sync_config_file(*, source: Path, target: Path, force: bool = False) -> Action:
    if not source.is_file():
        raise InstallError(f"Canonical config file not found: {source}")

    target.parent.mkdir(parents=True, exist_ok=True)
    if _same_content(source, target):
        return Action("exists", target, source)

    if target.exists() or target.is_symlink():
        if not force:
            raise InstallError(
                f"Runtime config differs from canonical repository file: {target}. "
                "Review the diff, then rerun with --force to back it up and replace it."
            )
        backup = _backup_path(target)
        if target.is_symlink():
            resolved = target.resolve(strict=False)
            target.unlink()
            if resolved.is_file():
                shutil.copy2(resolved, backup)
            else:
                backup.write_text(f"symlink -> {resolved}\n", encoding="utf-8")
        else:
            shutil.copy2(target, backup)
    else:
        backup = None

    temp = target.with_name(f".{target.name}.omp-kit.tmp")
    shutil.copy2(source, temp)
    os.replace(temp, target)
    return Action("installed" if backup is None else "replaced", target, source, backup)


def install_harness(
    *, repo_root: Path, agent_root: Path, force: bool = False
) -> list[Action]:
    repo_root = repo_root.expanduser().resolve()
    agent_root = agent_root.expanduser()

    actions: list[Action] = []
    try:
        for kind, _name, source, target in link_skills(
            repo_root=repo_root, agent_root=agent_root, force=force, prune=False
        ):
            actions.append(Action(kind, target, source))
    except LinkError as exc:
        raise InstallError(str(exc)) from exc

    actions.extend(link_agents(repo_root=repo_root, agent_root=agent_root, force=force))

    config_root = repo_root / "config"
    for name in ("config.yml", "models.yml"):
        actions.append(
            sync_config_file(
                source=config_root / name,
                target=agent_root / name,
                force=force,
            )
        )

    return actions


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install OMP Kit skills, agents, config.yml, and models.yml into an OMP agent root."
    )
    parser.add_argument(
        "--agent-root",
        type=Path,
        default=Path(os.environ.get("AGENT_ROOT", "~/.omp/agent")),
        help="OMP agent root; default: ~/.omp/agent or $AGENT_ROOT",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path.cwd(),
        help="OMP Kit repository root; default: current working directory",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Replace differing config files after creating timestamped backups; relink only managed symlink agents/skills.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        actions = install_harness(
            repo_root=args.repo_root,
            agent_root=args.agent_root,
            force=args.force,
        )
    except InstallError as exc:
        print(f"error: {exc}")
        return 1

    for action in actions:
        print(action.format())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
