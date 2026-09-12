set dotenv-load := false

# Install the complete tracked OMP harness into ~/.omp/agent without overwriting drift.
install *args:
    uv run python scripts/install_harness.py {{args}}

# Replace differing tracked config after timestamped backups; relink managed symlinks.
install-force:
    uv run python scripts/install_harness.py --force

# Legacy skill-only installer for focused maintenance/debugging.
install-skills *args:
    uv run python scripts/link_skills.py {{args}}

# Generate registry.yaml from resource.yaml files.
build-registry:
    uv run python scripts/build_registry.py

# Fail if registry.yaml differs from resource.yaml files.
check-registry:
    uv run python scripts/build_registry.py --check

# Validate registry.yaml and referenced resource paths.
validate-registry:
    uv run python scripts/validate_registry.py

# Print registry.yaml as a compact human-readable index.
build-index:
    uv run python scripts/build_index.py

# Scan a path for risky files and command patterns.
scan-risk path:
    uv run python scripts/scan_risk.py {{path}}

# Promote a draft skill into skills/ and update generated registry.yaml.
promote-skill path *args:
    uv run python scripts/promote_skill.py {{path}} {{args}}

# Run all repository tests (fast gate).
test:
    uv run python -m pytest tests

# Pull all standalone git repos under references/ and print a summary.
pull-references:
    uv run python scripts/git_pull_references.py

# Generate skeleton docs for reference repos that lack them.
init-reference-docs:
    uv run python scripts/init_reference_docs.py
