from __future__ import annotations

import argparse
import os
import stat
from dataclasses import dataclass
from pathlib import Path

MAX_TEXT_BYTES = 1_000_000

MANIFEST_NAMES = {
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "setup.py",
    "uv.lock",
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "Cargo.toml",
    "go.mod",
}

TEXT_SUFFIXES = {
    ".bash",
    ".cjs",
    ".js",
    ".json",
    ".lock",
    ".mjs",
    ".md",
    ".py",
    ".sh",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

PATTERNS = {
    "destructive command": ["rm -rf", "mkfs", "dd if=", ":(){ :|:& };:"],
    "privilege change": ["sudo", "chmod 777", "chown -R"],
    "shell pipe installer": ["curl | bash", "curl|bash", "wget | sh", "wget|sh"],
    "dynamic execution": ["eval(", "exec(", "subprocess", "child_process"],
    "secrets indicator": [".env", "token", "secret", "api_key", "apikey", "private_key"],
    "ssh indicator": ["~/.ssh", "ssh-key", "ssh_key", "id_rsa"],
    "network indicator": ["http://", "https://", "fetch(", "requests.", "axios"],
}


@dataclass(frozen=True)
class Finding:
    path: Path
    kind: str
    detail: str

    def format(self, *, root: Path) -> str:
        try:
            rel = self.path.relative_to(root)
        except ValueError:
            rel = self.path
        return f"{rel}: {self.kind}: {self.detail}"


def is_executable(path: Path) -> bool:
    try:
        mode = path.stat().st_mode
    except OSError:
        return False
    return bool(mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH))


def looks_textual(path: Path) -> bool:
    return path.suffix.lower() in TEXT_SUFFIXES or path.name in MANIFEST_NAMES


def read_text_sample(path: Path) -> str:
    data = path.read_bytes()[:MAX_TEXT_BYTES]
    return data.decode("utf-8", errors="ignore")


def scan_path(root: Path) -> list[Finding]:
    root = root.resolve()
    if not root.exists():
        raise FileNotFoundError(root)

    files = [root] if root.is_file() else [path for path in root.rglob("*") if path.is_file()]
    findings: list[Finding] = []

    for path in sorted(files):
        name = path.name
        suffix = path.suffix.lower()

        if name in MANIFEST_NAMES:
            findings.append(Finding(path, "dependency manifest", name))

        if suffix in {".sh", ".bash"}:
            findings.append(Finding(path, "shell script", suffix))

        if is_executable(path):
            findings.append(Finding(path, "executable file", oct(os.stat(path).st_mode & 0o777)))

        if not looks_textual(path):
            continue

        text = read_text_sample(path).lower()
        for kind, needles in PATTERNS.items():
            for needle in needles:
                if needle.lower() in text:
                    findings.append(Finding(path, kind, needle))
                    break

    return findings


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scan a path for review-worthy risk indicators")
    parser.add_argument("path", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        findings = scan_path(args.path)
    except FileNotFoundError:
        print(f"error: path not found: {args.path}")
        return 1

    root = args.path.resolve()
    if not findings:
        print(f"ok: no risk indicators found under {args.path}")
        return 0

    print(f"risk indicators under {args.path}:")
    for finding in findings:
        print(f"- {finding.format(root=root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
