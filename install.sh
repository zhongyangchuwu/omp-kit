#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if command -v uv >/dev/null 2>&1; then
    exec uv run --script "$ROOT/scripts/install_harness.py" "$@"
fi
printf '%s\n' 'Install uv first, or use Python 3.12+ with PyYAML to run scripts/install_harness.py.' >&2
exit 1
