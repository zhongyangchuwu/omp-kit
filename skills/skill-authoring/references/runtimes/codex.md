# Codex Runtime Notes

These notes are environment-specific. Do not treat them as portable Agent Skills requirements.

## What to remember

Codex supports Agent Skills as reusable workflow bundles with `SKILL.md` and optional support files. Codex can invoke skills explicitly with `$skill-name` and includes `$skill-creator` as an interactive authoring pattern.

Codex documentation distinguishes:

- skills as workflow authoring format;
- plugins as distribution and installation units.

## How to use this information

Use `$skill-creator` as a reference pattern, not as a required dependency. A portable skill should still be understandable and useful without Codex.

## Avoid in portable output

- Codex plugin manifests;
- Codex-only installation paths;
- `$skill-name` invocation as the only documented usage;
- assumptions about repo/user/admin/system skill precedence unless the user asks for Codex-specific deployment.

When the target is Codex, keep those details in a dedicated runtime section or deployment note.
