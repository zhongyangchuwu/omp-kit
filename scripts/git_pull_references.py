from __future__ import annotations

import subprocess

from dataclasses import dataclass
from pathlib import Path

REFERENCES = Path("references")


@dataclass(frozen=True)
class Result:
    name: str
    status: str       # pulled | up-to-date | skipped | failed
    detail: str = ""  # short summary or error message


def pull_one(repo: Path) -> Result:
    name = repo.name
    if not (repo / ".git").is_dir():
        return Result(name, "skipped", "not a standalone repo")

    try:
        proc = subprocess.run(
            ["git", "-C", str(repo), "pull", "--ff-only"],
            capture_output=True, text=True, timeout=120,
        )
    except subprocess.TimeoutExpired:
        return Result(name, "failed", "timed out after 120s")
    except OSError as e:
        return Result(name, "failed", str(e))

    if proc.returncode != 0:
        # Extract last meaningful line from stderr
        err_lines = [ln for ln in proc.stderr.strip().splitlines() if ln]
        detail = err_lines[-1] if err_lines else f"exit {proc.returncode}"
        return Result(name, "failed", detail)

    stdout = proc.stdout.strip()
    if "Already up to date." in stdout:
        return Result(name, "up-to-date", "")
    # Count fast-forward range if present
    for line in stdout.splitlines():
        if line.startswith("Updating ") and ".." in line:
            return Result(name, "pulled", line.removeprefix("Updating "))
    return Result(name, "pulled", "")


def main() -> int:
    if not REFERENCES.is_dir():
        print("references/ directory not found.")
        return 0
    refs = sorted(REFERENCES.iterdir(), key=lambda p: p.name.lower())
    if not refs:
        print("No references/ directories found.")
        return 0

    repos = [p for p in refs if p.is_dir()]
    total = len(repos)

    # Pull with real-time progress
    results: list[Result] = []
    for i, r in enumerate(repos, 1):
        result = pull_one(r)
        results.append(result)
        tag = {"pulled": "PULL", "up-to-date": " OK ", "skipped": "SKIP", "failed": "FAIL"}[result.status]
        detail = f" — {result.detail}" if result.detail else ""
        print(f"[{i}/{total}] {tag}  {result.name}{detail}")

    # Summary
    counts = {s: sum(1 for r in results if r.status == s) for s in ["pulled", "up-to-date", "skipped", "failed"]}
    parts = []
    if counts["pulled"]:
        parts.append(f"{counts['pulled']} pulled")
    if counts["up-to-date"]:
        parts.append(f"{counts['up-to-date']} up to date")
    if counts["skipped"]:
        parts.append(f"{counts['skipped']} skipped")
    if counts["failed"]:
        parts.append(f"{counts['failed']} failed")
    print(f"---\n{len(repos)} repos: {', '.join(parts)}")

    return 1 if counts["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
