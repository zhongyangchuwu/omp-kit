set dotenv-load := false

# Link every skill under ./skills into ~/.agents/skills.
link-skills *args:
    uv run python scripts/link_skills.py {{args}}

# Replace stale ~/.agents/skills symlinks and prune old repository skill names.
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
    uv run pytest tests
