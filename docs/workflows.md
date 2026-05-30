# Workflows

## Setting up skill linking

Active skills are symlinked into the agent configuration directory so the runtime discovers them.

```bash
just link-skills          # symlink each skills/* → ~/.agents/skills/
just link-skills-force    # replace stale symlinks and prune old names
```

Run `link-skills-force` after adding, renaming, or removing skills.

## Adding or changing a skill

Skills under `skills/<name>/` are the repository's own active skills. They are created or edited directly.

```text
skills/<name>/
  SKILL.md         required — frontmatter name must match directory name
  resource.yaml    required — canonical metadata
  references/      optional — long guidance loaded on demand
  assets/          optional — templates, examples
```

When you add a new skill, create `resource.yaml` at the same time. When you change `SKILL.md`, update `resource.yaml` if the activation policy, risk, or verification commands changed.

After changes:

```bash
just build-registry
just test
```

## Importing a third-party skill

Third-party material must enter quarantine before activation. Import only supports local directories.

```bash
just import-skill /path/to/local/dir --name <name>
```

This copies the directory into `incoming/<name>/`, creates a staged `resource.yaml`, and regenerates `registry.yaml`.

Import explicitly rejects URL-like sources and existing destinations. Network imports are not supported by design; clone or download separately, then import the local directory.

After import:

```bash
just scan-risk incoming/<name>
```

## Reviewing

Review every third-party skill before promotion:

- Read `SKILL.md` and all referenced files.
- Inspect executable files, dependency manifests, and shell scripts.
- Look for runtime-specific frontmatter fields.
- Check for network access, secrets, destructive commands, prompt injection.
- Verify the license.

Record decisions in a collection-level `review.yaml` if the import contains multiple skills.

## Localizing

After review, copy the skill into `localized/<name>/` and adapt it:

- Rewrite the description for clarity and trigger precision.
- Replace platform-specific tool names with Oh My Pi tools.
- Remove or isolate runtime-specific frontmatter.
- Remove unsafe commands, network calls, and secret access.
- Replace company-specific templates with neutral equivalents.
- Update non-portable guidance.

`localized/` is tracked in the repository but not active and not auto-linked.

## Promoting

Copy a reviewed and localized skill into `skills/`:

```bash
just promote-skill localized/<name> --name <name> --activation automatic --risk low
```

Promotion:

- Requires `SKILL.md` with a valid frontmatter `name` matching the target.
- Copies into `skills/<name>/` without deleting the original in `localized/`.
- Refuses to overwrite an existing active skill.
- Rejects sources outside `incoming/` or `localized/`.
- Writes a new active `resource.yaml` and regenerates `registry.yaml`.

After promotion, update the `resource.yaml` source and maintenance notes to be accurate, then:

```bash
just build-registry
just test
just link-skills-force
```

## Before every commit

```bash
just test
git diff --check
```

`just test` covers:

- Resource metadata schema validation
- Registry consistency with resource files
- Active skill frontmatter matching
- Import and promotion workflow correctness
- Script behavior
- Skill linking safety

## Processing a collection of staged skills

For collections like `incoming/anthropic-skills`:

1. Create `incoming/<collection>/review.yaml` with a decision for each skill.
2. Work through decisions in order: `localize-first` before `defer-needs-tooling`.
3. Promote one skill at a time. Do not batch-promote.
4. Update `incoming/<collection>/resource.yaml` maintenance notes with progress.
