from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
try:
    from scripts.resource_metadata import (
        ResourceWorkflowError,
        copy_resource_tree,
        default_resource_metadata,
        regenerate_registry,
        write_resource_metadata,
    )
except ModuleNotFoundError:  # direct execution: python scripts/import_skill.py
    from resource_metadata import (
        ResourceWorkflowError,
        copy_resource_tree,
        default_resource_metadata,
        regenerate_registry,
        write_resource_metadata,
    )

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import local third-party skill material into incoming/")
    parser.add_argument("source", help="Local directory to import")
    parser.add_argument("--name", help="Local import name; defaults to source directory name")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    return parser.parse_args()


def is_url_like(source: str) -> bool:
    return "://" in source or source.startswith(("git@", "ssh:"))


def import_skill(*, source: Path, name: str, repo_root: Path) -> Path:
    if not name:
        raise ResourceWorkflowError("name must be non-empty")
    if "/" in name or "\\" in name:
        raise ResourceWorkflowError("name must be a single directory name")

    source = source.expanduser().resolve()
    if not source.exists():
        raise ResourceWorkflowError(f"source does not exist: {source}")
    if not source.is_dir():
        raise ResourceWorkflowError(f"source is not a directory: {source}")

    destination = repo_root / "incoming" / name
    copy_resource_tree(source, destination)

    metadata = default_resource_metadata(
        name=name,
        kind="incoming",
        status="staged",
        path=f"incoming/{name}",
        source_type="third-party",
        source_origin=str(source),
        risk_level="medium",
        risk_reason="Imported third-party material pending review before activation.",
        activation_mode="not-applicable",
        activation_notes="Staged imports are quarantined and must not be linked into active skill scan paths.",
        verification_notes=[
            "Review every SKILL.md and referenced support file before promotion.",
            "Inspect executable files and dependency manifests.",
            "Resolve runtime-specific fields, duplicate names, license terms, and unsafe instructions.",
        ],
        maintenance_last_reviewed=date.today().isoformat(),
        maintenance_notes=["Created by scripts/import_skill.py."],
    )
    write_resource_metadata(destination, metadata)
    regenerate_registry(repo_root)
    return destination


def main() -> int:
    args = parse_args()
    if is_url_like(args.source):
        print("error: network imports are not supported; pass a local directory")
        return 1

    repo_root = args.repo_root.resolve()
    source = Path(args.source)
    name = args.name or source.name
    try:
        destination = import_skill(source=source, name=name, repo_root=repo_root)
    except ResourceWorkflowError as exc:
        print(f"error: {exc}")
        return 1

    print(f"imported: {destination}")
    print("updated: registry.yaml")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
