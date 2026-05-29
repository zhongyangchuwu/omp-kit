from __future__ import annotations

import argparse
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import third-party skill material into quarantine")
    parser.add_argument("source", help="Source URL or path to import")
    parser.add_argument("--name", help="Local import name")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    name = f" as {args.name}" if args.name else ""
    print(
        "not implemented: import workflow is intentionally scaffolded only; "
        f"would import {args.source}{name} into incoming/ after vendor/localized conventions are exercised"
    )
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
