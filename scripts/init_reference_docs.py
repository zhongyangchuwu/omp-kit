from __future__ import annotations

import subprocess
from datetime import datetime, timezone
from pathlib import Path

REFERENCES = Path("references")
TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")

TEMPLATE = """# {title}

## Metadata

remote: {remote}
branch: {branch}
commit: {commit}
pulled: {pulled}
changed: {changed}

## What

<!-- TODO: brief description of the project -->

## Why

<!-- TODO: relevance to pi-kit -->

## Notes

<!-- TODO: key subdirectories, update policy, caveats -->
"""


def git_info(repo: Path) -> dict[str, str] | None:
    if not (repo / ".git").is_dir():
        return None
    try:
        remote = subprocess.check_output(
            ["git", "-C", str(repo), "remote", "get-url", "origin"],
            text=True,
        ).strip()
        branch = subprocess.check_output(
            ["git", "-C", str(repo), "branch", "--show-current"],
            text=True,
        ).strip()
        commit = subprocess.check_output(
            ["git", "-C", str(repo), "rev-parse", "--short", "HEAD"],
            text=True,
        ).strip()
        pulled = subprocess.check_output(
            ["git", "-C", str(repo), "log", "-1", "--format=%ci"],
            text=True,
        ).strip()[:10]
    except subprocess.CalledProcessError:
        return None
    return {"remote": remote, "branch": branch, "commit": commit, "pulled": pulled}


def main() -> int:
    if not REFERENCES.is_dir():
        print("references/ directory not found.")
        return 1

    created = 0
    skipped = 0
    for repo in sorted(REFERENCES.iterdir()):
        if not repo.is_dir():
            continue
        doc = REFERENCES / f"{repo.name}.md"
        if doc.exists():
            print(f"SKIP  {doc} (already exists)")
            skipped += 1
            continue

        info = git_info(repo)
        if info is None:
            print(f"SKIP  {repo.name} (not a git repo)")
            skipped += 1
            continue

        content = TEMPLATE.format(
            title=repo.name,
            remote=info["remote"],
            branch=info["branch"],
            commit=info["commit"],
            pulled=info["pulled"],
            changed=TODAY,
        )
        doc.write_text(content)
        print(f"CREATED  {doc}")
        created += 1

    print(f"---\n{created} created, {skipped} skipped")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
