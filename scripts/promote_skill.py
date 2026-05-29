from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Promote a localized candidate into an active resource directory")
    parser.add_argument("path", type=Path, help="Localized candidate path")
    parser.add_argument("--name", help="Active resource name")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    name = f" as {args.name}" if args.name else ""
    print(
        "not implemented: promotion workflow is intentionally scaffolded only; "
        f"would promote {args.path}{name} after resource-local metadata and tests are defined"
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
