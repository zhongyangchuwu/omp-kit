# Incoming — Processing Status

Each staged collection below needs review and promotion into `skills/`.
See `registry.yaml` → `incoming:` for source paths, counts, and risk notes.

## anthropic-skills

Source: `https://github.com/anthropics/skills` local clone.
18 `SKILL.md` files across document skills (xlsx, docx, pptx, pdf) and example skills (algorithmic-art, brand-guidelines, canvas-design, frontend-design, mcp-builder, etc.).

- [ ] Read each `SKILL.md` and all support files it references.
- [ ] Inspect every executable file and dependency manifest under the skill directory.
- [ ] Resolve `license` frontmatter not standard; decide whether to keep or drop.
- [ ] Resolve duplicates with `claude-plugins-official` if promoting overlapping skills.
- [ ] Add validated skills to `registry.yaml` under `skills:` with path, risk, verification commands.

## claude-plugins-official

Source: local marketplace cache.
28 skills from internal and external plugin directories.

- [ ] Resolve duplicate frontmatter names: `access`, `configure`, `frontend-design`, `skill-creator`.
- [ ] Strip or adapt runtime-specific frontmatter: `version`, `tools`, `allowed-tools`, `user-invocable`, `argument-hint`.
- [ ] Read each `SKILL.md` and all support files it references.
- [ ] Inspect every executable file and dependency manifest.
- [ ] Add validated skills to `registry.yaml` under `skills:` with path, risk, verification commands.

## Promotion checklist (reference)

For each skill being promoted:

1. Read `SKILL.md` and every supporting file.
2. Inspect all executable files and dependency manifests.
3. Remove or adapt runtime-specific frontmatter unless the target runtime requires it.
4. Ensure directory name matches frontmatter `name`.
5. Resolve duplicate names.
6. Run `skills-ref validate skills/<skill-name>` if available.
7. Add entry to `registry.yaml` under `skills:` with path, risk, reason, and verification commands.
