set dotenv-load := false

# Install each ./skills/* directory into ~/.omp/agent/skills.
install *args:
    uv run python scripts/link_skills.py {{args}}

# Replace stale per-skill symlinks under ~/.omp/agent/skills.
install-force:
    uv run python scripts/link_skills.py --force --prune

# Legacy alias for installing per-skill links.
link-skills *args:
    uv run python scripts/link_skills.py {{args}}

# Legacy alias for replacing stale per-skill links.
link-skills-force:
    uv run python scripts/link_skills.py --force --prune

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
