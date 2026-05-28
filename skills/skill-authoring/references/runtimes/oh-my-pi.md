# oh-my-pi Runtime Notes

These notes are environment-specific. Do not treat them as portable Agent Skills requirements.

## Discovery

oh-my-pi discovers skills one level under a skills root:

```text
<skills-root>/<skill-name>/SKILL.md
```

Nested skills are not discovered by default provider scanning unless configuration points at the nested parent.

## Invocation and file access

oh-my-pi supports explicit skill invocation and skill file reads:

```text
/skill:<name>
skill://<name>
skill://<name>/<relative-path>
```

`skill://` rejects absolute paths and path traversal, and resolves only inside the skill directory.

## Frontmatter

oh-my-pi may recognize extra fields such as `globs` and `alwaysApply`. These are runtime-specific fields. Do not generate them for portable skills unless the user explicitly asks for oh-my-pi behavior.

## Authoring implications

- Keep each portable skill at one directory level.
- Always include explicit `name` and `description`.
- Avoid duplicate skill names because provider precedence decides which one wins.
- Use relative file links in the skill itself; use `skill://` only when discussing oh-my-pi runtime usage.
