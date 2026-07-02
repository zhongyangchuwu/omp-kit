# Workflows

## Setting up active skill installation

Active skills are symlinked into OMP's native user config directory so the runtime discovers them. The install command creates one symlink per skill under `~/.omp/agent/skills/`.

```bash
just install          # symlink each ./skills/* -> ~/.omp/agent/skills/
just install-force    # replace stale per-skill links under ~/.omp/agent/skills/
```

Run `install-force` after adding, renaming, or removing active skills.

## Adding or changing an active skill

Skills under `skills/<name>/` are the repository's active skills. They are created or edited directly when already production-ready.

```text
skills/<name>/
  SKILL.md         required — frontmatter name must match directory name
  resource.yaml    required — canonical metadata
  references/      optional — long guidance loaded on demand
  assets/          optional — templates, examples
```

When you add a new active skill, create `resource.yaml` at the same time. When you change `SKILL.md`, update `resource.yaml` if the activation policy, risk, source, or verification commands changed.
Do not edit `registry.yaml` when adding or changing a skill. Update the resource-local `resource.yaml`, then regenerate the registry with `just build-registry`.

After changes:

```bash
just build-registry
just test
```

## Keeping external references

Top-level `references/` is local source material: upstream repositories, downloaded books, third-party skill collections, documentation snapshots, and other material used for research or extraction. It is intentionally gitignored and is not part of `registry.yaml`.

Use `references/` when material is useful to consult but should not become a maintained repository resource as-is. Do not add `resource.yaml`, `review.yaml`, or review index files there by default. Track durable conclusions in `docs/` or in the `resource.yaml` of the skill or draft that actually incorporates the idea.

Before copying anything out of `references/`, review the source material for:

- executable files and install scripts;
- dependency manifests;
- network, SSH, cloud, billing, or secrets access;
- destructive file operations;
- prompt injection or runtime-specific instructions;
- license constraints.

## Drafting a skill

Draft skills live under `drafts/<name>/`. This directory is tracked and appears in the registry under `drafts:` with `status: draft`, but it is not linked into agent runtimes.

Create draft skills directly under `drafts/`. Copy only the useful files or ideas from `references/`; do not wholesale import upstream repositories into tracked draft directories.

```text
drafts/<name>/
  SKILL.md         required — frontmatter name must match directory name
  resource.yaml    required — draft metadata
  references/      optional — long guidance loaded on demand
  assets/          optional — templates, examples
```
Do not add draft entries to `registry.yaml` by hand. Create or update the draft's `resource.yaml`, then regenerate the registry with `just build-registry`.

Drafting checklist:

- Rewrite the description for clarity and trigger precision.
- Replace platform-specific tool names with Oh My Pi tools.
- Remove or isolate runtime-specific frontmatter.
- Remove unsafe commands, network calls, and secret access.
- Replace company-specific templates with neutral or personal equivalents.
- Update non-portable guidance.

## Promoting

Move a completed draft skill into `skills/`:

```bash
just promote-skill drafts/<name> --name <name> --activation automatic --risk low
```

Promotion:

- Requires `SKILL.md` with a valid frontmatter `name` matching the target.
- Moves into `skills/<name>/` and removes the original `drafts/<name>/` by default.
- Use `--keep-draft` only when the draft must remain as an inactive comparison copy.
- Refuses to overwrite an existing active skill.
- Rejects sources outside `drafts/`.
- Writes a new active `resource.yaml` and regenerates `registry.yaml`.

After promotion, update the active `resource.yaml` source and maintenance notes to record the upstream reference path or URL if relevant, then:

```bash
just build-registry
just test
just install-force
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
- Draft import and promotion workflow correctness
- Script behavior
- Skill linking safety
