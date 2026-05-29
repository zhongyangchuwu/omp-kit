from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

ALLOWED_GROUPS = {"skills", "extensions", "tools", "packages", "incoming", "imports"}
ALLOWED_RISKS = {"low", "medium", "high"}
ALLOWED_STATUSES = {"active", "staged", "localized", "archived", "draft"}
REQUIRED_FIELDS = {"path", "status", "risk"}
SKILL_NAME_RE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---", re.DOTALL)


@dataclass(frozen=True)
class RegistryIssue:
    location: str
    message: str

    def format(self) -> str:
        return f"{self.location}: {self.message}"


class RegistryValidationError(ValueError):
    """Raised when registry.yaml is structurally invalid."""

    def __init__(self, issues: list[RegistryIssue]) -> None:
        self.issues = issues
        super().__init__("\n".join(issue.format() for issue in issues))


def default_repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_registry(path: Path) -> dict[str, Any]:
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        raise RegistryValidationError([RegistryIssue(str(path), f"YAML parse error: {exc}")]) from exc

    if not isinstance(data, dict):
        raise RegistryValidationError([RegistryIssue(str(path), "registry root must be a mapping")])
    return data


def parse_frontmatter(path: Path) -> dict[str, str]:
    match = FRONTMATTER_RE.search(path.read_text(encoding="utf-8"))
    if match is None:
        return {}

    values: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line or line.startswith((" ", "-")):
            continue
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip().strip("\"'")
    return values


def validate_registry(data: dict[str, Any], *, repo_root: Path) -> list[RegistryIssue]:
    issues: list[RegistryIssue] = []

    unknown_groups = set(data) - ALLOWED_GROUPS
    for group in sorted(unknown_groups):
        issues.append(RegistryIssue(group, "unknown top-level registry group"))

    for group in sorted(ALLOWED_GROUPS):
        entries = data.get(group, {})
        if entries is None:
            continue
        if not isinstance(entries, dict):
            issues.append(RegistryIssue(group, "group must be a mapping"))
            continue

        for name, entry in entries.items():
            location = f"{group}.{name}"
            if not isinstance(entry, dict):
                issues.append(RegistryIssue(location, "entry must be a mapping"))
                continue

            missing = REQUIRED_FIELDS - set(entry)
            for field in sorted(missing):
                issues.append(RegistryIssue(location, f"missing required field: {field}"))

            path_value = entry.get("path")
            if isinstance(path_value, str) and path_value:
                path = repo_root / path_value
                if not path.exists():
                    issues.append(RegistryIssue(location, f"path does not exist: {path_value}"))
            elif "path" in entry:
                issues.append(RegistryIssue(location, "path must be a non-empty string"))

            status = entry.get("status")
            if "status" in entry and status not in ALLOWED_STATUSES:
                issues.append(RegistryIssue(location, f"invalid status: {status}"))

            risk = entry.get("risk")
            if "risk" in entry and risk not in ALLOWED_RISKS:
                issues.append(RegistryIssue(location, f"invalid risk: {risk}"))

            if group == "skills" and status == "active" and isinstance(path_value, str):
                validate_active_skill(repo_root, name, path_value, issues)

            if group == "incoming" and isinstance(path_value, str):
                path = Path(path_value)
                if path.parts and path.parts[0] == "skills":
                    issues.append(RegistryIssue(location, "incoming entry must not live under skills/"))

    return issues


def validate_active_skill(repo_root: Path, name: str, path_value: str, issues: list[RegistryIssue]) -> None:
    location = f"skills.{name}"
    path = repo_root / path_value
    skill_md = path / "SKILL.md"
    if not skill_md.is_file():
        issues.append(RegistryIssue(location, f"SKILL.md missing under {path_value}"))
        return

    frontmatter = parse_frontmatter(skill_md)
    frontmatter_name = frontmatter.get("name")
    if frontmatter_name is None:
        issues.append(RegistryIssue(location, "SKILL.md frontmatter missing name"))
        return
    if frontmatter_name != name:
        issues.append(RegistryIssue(location, f"frontmatter name {frontmatter_name!r} != registry key {name!r}"))
    if not SKILL_NAME_RE.fullmatch(frontmatter_name):
        issues.append(RegistryIssue(location, f"frontmatter name is not kebab-case: {frontmatter_name!r}"))
    if not frontmatter.get("description"):
        issues.append(RegistryIssue(location, "SKILL.md frontmatter missing description"))


def validate_registry_file(path: Path, *, repo_root: Path) -> list[RegistryIssue]:
    return validate_registry(load_registry(path), repo_root=repo_root)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate registry.yaml and referenced resource paths")
    parser.add_argument("registry", nargs="?", type=Path, default=default_repo_root() / "registry.yaml")
    parser.add_argument("--repo-root", type=Path, default=default_repo_root())
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        issues = validate_registry_file(args.registry, repo_root=args.repo_root)
    except RegistryValidationError as exc:
        for issue in exc.issues:
            print(f"error: {issue.format()}")
        return 1

    if issues:
        for issue in issues:
            print(f"error: {issue.format()}")
        return 1

    print(f"ok: {args.registry}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
