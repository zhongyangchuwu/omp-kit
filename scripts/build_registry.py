from __future__ import annotations

import argparse
from pathlib import Path

try:
    from scripts.resource_metadata import generated_registry
except ModuleNotFoundError:  # direct execution: python scripts/build_registry.py
    from resource_metadata import generated_registry


def default_repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate registry.yaml from resource.yaml files")
    parser.add_argument("--repo-root", type=Path, default=default_repo_root())
    parser.add_argument("--check", action="store_true", help="Fail if registry.yaml differs from generated content")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = args.repo_root.resolve()
    registry_path = repo_root / "registry.yaml"
    content, issues = generated_registry(repo_root)

    if issues:
        for issue in issues:
            print(f"error: {issue.format()}")
        return 1

    if args.check:
        current = registry_path.read_text(encoding="utf-8") if registry_path.exists() else ""
        if current != content:
            print("error: registry.yaml is out of date; run `just build-registry`")
            return 1
        print("ok: registry.yaml is up to date")
        return 0

    registry_path.write_text(content, encoding="utf-8")
    print(f"wrote: {registry_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
