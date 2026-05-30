from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
try:
    from scripts.resource_metadata import (
        ALLOWED_ACTIVATION_MODES,
        ALLOWED_RISKS,
        ResourceWorkflowError,
        copy_resource_tree,
        default_resource_metadata,
        parse_skill_frontmatter,
        regenerate_registry,
        write_resource_metadata,
    )
except ModuleNotFoundError:  # direct execution: python scripts/promote_skill.py
    from resource_metadata import (
        ALLOWED_ACTIVATION_MODES,
        ALLOWED_RISKS,
        ResourceWorkflowError,
        copy_resource_tree,
        default_resource_metadata,
        parse_skill_frontmatter,
        regenerate_registry,
        write_resource_metadata,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Safely promote a draft skill into skills/")
    parser.add_argument("path", type=Path, help="Source skill directory under drafts/")
    parser.add_argument("--name", help="Active skill name; defaults to SKILL.md frontmatter name")
    parser.add_argument("--activation", choices=sorted(ALLOWED_ACTIVATION_MODES - {"not-applicable"}), default="automatic")
    parser.add_argument("--risk", choices=sorted(ALLOWED_RISKS), default="medium")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    return parser.parse_args()


def _repo_relative(path: Path, repo_root: Path) -> str:
    try:
        return path.resolve().relative_to(repo_root).as_posix()
    except ValueError as exc:
        raise ResourceWorkflowError(f"source must be inside repository: {path}") from exc


def promote_skill(*, source: Path, name: str | None, activation: str, risk: str, repo_root: Path) -> Path:
    source = source.expanduser().resolve()
    if not source.exists():
        raise ResourceWorkflowError(f"source does not exist: {source}")
    if not source.is_dir():
        raise ResourceWorkflowError(f"source is not a directory: {source}")

    relative_source = _repo_relative(source, repo_root)
    if not relative_source.startswith("drafts/"):
        raise ResourceWorkflowError("source must be under drafts/")

    skill_md = source / "SKILL.md"
    if not skill_md.is_file():
        raise ResourceWorkflowError(f"SKILL.md missing: {skill_md}")

    frontmatter = parse_skill_frontmatter(skill_md)
    frontmatter_name = frontmatter.get("name")
    if not frontmatter_name:
        raise ResourceWorkflowError("SKILL.md frontmatter missing name")

    target_name = name or frontmatter_name
    if target_name != frontmatter_name:
        raise ResourceWorkflowError(f"target name {target_name!r} does not match SKILL.md name {frontmatter_name!r}")
    if "/" in target_name or "\\" in target_name:
        raise ResourceWorkflowError("name must be a single directory name")

    destination = repo_root / "skills" / target_name
    copy_resource_tree(source, destination)

    metadata = default_resource_metadata(
        name=target_name,
        kind="skill",
        status="active",
        path=f"skills/{target_name}",
        source_type="promoted-local",
        source_origin=relative_source,
        risk_level=risk,
        risk_reason="Promoted skill; review resource metadata before adding high-risk capabilities.",
        activation_mode=activation,
        activation_notes="Activation policy selected during promotion; refine before relying on this skill broadly.",
        verification_notes=[
            f"Run skills-ref validate skills/{target_name} when available.",
            "Run repository tests after promotion.",
        ],
        maintenance_last_reviewed=date.today().isoformat(),
        maintenance_notes=["Created by scripts/promote_skill.py.", f"Draft retained at {relative_source}."],
        upstream=[],
    )
    write_resource_metadata(destination, metadata)
    regenerate_registry(repo_root)
    return destination


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    try:
        destination = promote_skill(
            source=args.path,
            name=args.name,
            activation=args.activation,
            risk=args.risk,
            repo_root=repo_root,
        )
    except ResourceWorkflowError as exc:
        print(f"error: {exc}")
        return 1

    print(f"promoted: {destination}")
    print("updated: registry.yaml")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
