# Resource Metadata

Use `resource.yaml` for parseable resource-local metadata. Top-level `registry.yaml` is generated from these files and must not be edited by hand.

## Location

Every tracked resource directory owns one metadata file:

```text
skills/<name>/resource.yaml
drafts/<name>/resource.yaml
extensions/<name>/resource.yaml
tools/<name>/resource.yaml
packages/<name>/resource.yaml
```

External source checkouts and downloads under `references/` are intentionally outside the resource model.

## Schema

The authoritative field shape lives in `schemas/resource.schema.yaml`. Resource validation uses that JSON Schema plus repository invariants such as directory/name/path matching.

```yaml
name: example
kind: skill
status: active
path: skills/example

source:
  type: self
  origin: null
  references: []
  imported: null
  promoted: null
  notes: []

risk:
  level: low
  reason: Human-readable risk rationale.

activation:
  mode: automatic
  notes: When or whether this resource can be activated.

verification:
  commands: []
  notes: []

maintenance:
  last_reviewed: "2026-05-29"
  notes: []

relationships:
  extensions: []
  tools: []
  packages: []
  upstream: []
```

## Field rules

- `name` is kebab-case and matches the resource directory name.
- `kind` is one of `skill`, `extension`, `tool`, or `package`.
- `status` is one of `active`, `archived`, or `draft`.
- `path` is repo-relative and points to the owning directory.
- `source.type` records provenance class such as `self`, `upstream-derived`, or `promoted-local`.
- `source.references` records reference inputs with `label`, local `path`, upstream `repository`, `branch`, and `commit` when known.
- Reference sources do not define local behavior; they are provenance, not design authority.
- `risk.level` is `low`, `medium`, or `high`.
- `risk.reason` explains the operational risk in human terms.
- `activation.mode` is `automatic`, `explicit-only`, `manual`, or `not-applicable`.
- `verification.commands` contains commands that can be run from the repository root.
- `maintenance.last_reviewed` is an ISO date string.
- `relationships` records future links between skills, extensions, tools, packages, and reference paths.

## Ownership

`resource.yaml` is the source of truth for detailed resource metadata. Put source, risk rationale, activation policy, verification commands, and maintenance notes here rather than in top-level `registry.yaml`.

## Reference and promotion workflow

- Keep external material under gitignored `references/` while reviewing or mining it for ideas.
- Create durable in-progress skills under `drafts/<name>` with their own `resource.yaml`.
- `just promote-skill drafts/<name> --name <name>` copies a reviewed draft into `skills/<name>`, writes active skill metadata, and keeps the draft copy intact.
- Promotion requires `SKILL.md` frontmatter `name` to match the target name.
