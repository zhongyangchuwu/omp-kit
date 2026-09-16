set dotenv-load := false

# Development install: link this working tree through OMP's native local install flow.
# Re-running is safe when dependencies or plugin registration change.
install:
    bun install --frozen-lockfile
    omp install .
    omp plugin list

# Inspect the runtime version and native plugin registration.
check-install:
    omp --version
    omp plugin list

# Doctor checks the whole active plugin root, not only omp-kit.
plugin-doctor:
    omp plugin doctor

uninstall:
    omp plugin uninstall omp-kit

# Explicit skill-library link helper; do not combine with duplicate native discovery.
install-skills *args:
    uv run python scripts/link_skills.py {{args}}

# Textual review aid only; not a sandbox or policy engine.
scan-risk path:
    uv run python scripts/scan_risk.py {{path}}

test:
    uv run --frozen python -m pytest tests

test-skill-authoring:
    uv run --frozen python -m pytest skills/skill-authoring/tests

# Isolated dependency environment; tests mock remote APIs and SSH.
test-autodl:
    cd skills/autodl && uv run --frozen python -m pytest tests

test-ts:
    bun run test:ts

typecheck:
    bun run typecheck

# Provider-free repository acceptance. No cloud resource or OMP model calls.
verify:
    just test
    just test-skill-authoring
    just test-autodl
    just typecheck
    just test-ts
    git diff --check HEAD

pull-references:
    uv run python scripts/git_pull_references.py

init-reference-docs:
    uv run python scripts/init_reference_docs.py
