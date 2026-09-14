set dotenv-load := false

# Native plugin installation does not replace user configuration.
install:
    omp plugin link .

# Explicit skill-library link helper; do not combine with duplicate native discovery.
install-skills *args:
    uv run python scripts/link_skills.py {{args}}

build-registry:
    uv run python scripts/build_registry.py

check-registry:
    uv run python scripts/build_registry.py --check

validate-registry:
    uv run python scripts/validate_registry.py

build-index:
    uv run python scripts/build_index.py

scan-risk path:
    uv run python scripts/scan_risk.py {{path}}

promote-skill path *args:
    uv run python scripts/promote_skill.py {{path}} {{args}}

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
    just check-registry
    just validate-registry
    git diff --check HEAD

pull-references:
    uv run python scripts/git_pull_references.py

init-reference-docs:
    uv run python scripts/init_reference_docs.py
