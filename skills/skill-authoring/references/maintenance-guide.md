# Maintenance Guide

Use this guide for long-term personal Skill-library care. Current behavior belongs in each `SKILL.md` and its support files; Git and PR history retain prior versions and chronology. Do not maintain a second registry merely to restate the active filesystem.

## When to review a Skill

Review a Skill when:

- its instructions no longer match current tools or workflow;
- its description false-triggers or misses intended tasks;
- scripts, references or dependencies change materially;
- a user correction reveals a bad default or missing boundary;
- two Skills start duplicating the same decision ownership.

## Update workflow

1. Read the current `SKILL.md` and support files that own the behavior.
2. Confirm the current runtime/tool behavior when the change depends on it.
3. Make the smallest coherent correction.
4. Check frontmatter, relative links, examples and templates.
5. Run the applicable skill-local or repository verification.
6. Use the PR/commit to explain material design changes when the diff alone is not enough.

Do not add a review date or provenance field just to prove maintenance happened. If a recurring review is actually required, schedule or track that obligation explicitly rather than relying on a manually synchronized timestamp.

## Archiving and retirement

A Skill should leave the active `skills/` discovery root when it is no longer correct, useful or safe. Git history is the default recovery path. If an inactive working copy is temporarily useful, keep it outside the active discovery path; no fixed archive or drafts directory is required.

Before removal, preserve only current knowledge that still belongs elsewhere. Do not keep obsolete policy alive merely to retain provenance.

## Quality checklist

Before declaring a Skill ready:

- [ ] directory name matches frontmatter `name`
- [ ] description says what the Skill does and when to use it
- [ ] `SKILL.md` is concise enough for activation-time loading
- [ ] references linked from `SKILL.md` exist
- [ ] scripts have bounded behavior, useful `--help`, and no embedded secrets
- [ ] runtime-specific notes are isolated from portable guidance
- [ ] safety or disclosure boundaries that matter during use are visible in the Skill itself
- [ ] applicable tests or validators pass
