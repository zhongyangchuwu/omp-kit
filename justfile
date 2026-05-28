set dotenv-load := false

# Link every skill under ./skills into ~/.agent/skills.
link-skills *args:
    uv run python scripts/link_skills.py {{args}}

# Replace existing ~/.agent/skills symlinks that point elsewhere.
link-skills-force:
    uv run python scripts/link_skills.py --force
