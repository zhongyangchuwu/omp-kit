# Personal Skills

Canonical repository for maintained personal Agent Skills.

## Skills

- `skills/autodl`: AutoDL Pro GPU resource and SSH operations helper. High risk because it controls paid compute and secret-bearing connections.
- `skills/skill-authoring`: Portable Agent Skills authoring, review, and maintenance guide.

See `registry.yaml` for status, risk, and verification commands. See `SKILLS_INDEX.md` for the index and maintenance rules.

## Verify

```bash
skills-ref validate skills/autodl
skills-ref validate skills/skill-authoring
uv run --project skills/autodl pytest skills/autodl/tests
uv run --project skills/autodl ruff check skills/autodl
uv run --with pytest pytest skills/skill-authoring/tests/test_docs.py
```
