set dotenv-load := false

# Portable installer uses its own small dependency environment.
install *args:
    uv run --script scripts/install_harness.py {{args}}

install-force:
    uv run --script scripts/install_harness.py --force

install-preview *args:
    uv run --script scripts/install_harness.py --dry-run {{args}}

validate-harness:
    uv run --script scripts/install_harness.py --validate

doctor:
    uv run --script scripts/install_harness.py --doctor

rollback:
    uv run --script scripts/install_harness.py --rollback

# Explicit legacy helper; not the normal managed-copy installation.
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
    uv run python -m pytest tests

# Final deterministic local gate. Live OMP/provider smokes are intentionally excluded.
verify:
    just test
    just validate-harness
    just check-registry
    just validate-registry
    git diff --check HEAD

pull-references:
    uv run python scripts/git_pull_references.py

init-reference-docs:
    uv run python scripts/init_reference_docs.py
