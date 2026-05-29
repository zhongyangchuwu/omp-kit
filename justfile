set dotenv-load := false

# Link every skill under ./skills into ~/.agents/skills.
link-skills *args:
    uv run python scripts/link_skills.py {{args}}

# Replace stale ~/.agents/skills symlinks and prune old repository skill names.
link-skills-force:
    uv run python scripts/link_skills.py --force --prune

# Run all repository tests (fast gate).
test:
    uv run --with pytest --with pyyaml pytest tests
