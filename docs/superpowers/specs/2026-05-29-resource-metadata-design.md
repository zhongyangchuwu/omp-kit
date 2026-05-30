# Resource Metadata Design

## Goal

Move detailed resource metadata out of top-level `registry.yaml` and into parseable resource-local YAML files, while keeping a committed generated registry for fast browsing and automation compatibility.

## Decisions

### `resource.yaml` is the canonical metadata file

Every tracked resource directory gets a `resource.yaml` file. Existing resources in scope:

```text
skills/autodl/resource.yaml
skills/skill-authoring/resource.yaml
skills/omp-superpowers/resource.yaml
incoming/anthropic-skills/resource.yaml
incoming/claude-plugins-official/resource.yaml
incoming/superpowers/resource.yaml
```

The file is YAML rather than Markdown because it remains human-readable while being directly parseable by tests and maintenance scripts.

### `registry.yaml` is generated and committed

`registry.yaml` remains in the repository, but it is no longer hand-maintained. It is generated from `resource.yaml` files and starts with a generated-file header.

`resource.yaml` is the source of truth. `registry.yaml` is a generated index/cache containing only:

```text
status
risk
path
```

### Medium schema

The first resource schema is intentionally moderate:

```yaml
name: example
kind: skill
status: active
path: skills/example

source:
  type: self
  origin: null

risk:
  level: low
  reason: Human-readable reason.

activation:
  mode: automatic
  notes: Human-readable trigger or non-trigger note.

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

This covers source, risk rationale, activation, verification, maintenance notes, and future links between skills/extensions/tools/packages without designing a full permissions/secrets/audit system prematurely.

### Registry generation mapping

```text
kind: skill     -> registry.skills
kind: extension -> registry.extensions
kind: tool      -> registry.tools
kind: package   -> registry.packages
kind: incoming  -> registry.incoming
kind: import    -> registry.imports
```

### Incoming review model

`incoming/REVIEW.md` becomes an index/orientation document. Per-resource details move into each incoming resource's `resource.yaml`.

### `skill-authoring` remains one active skill

Do not split `skill-authoring` into multiple active skills. Upgrade it as the router/reference hub for resource metadata, registry generation, and future package/tool/extension authoring.

## Scripts

Add:

```text
scripts/resource_metadata.py
scripts/build_registry.py
```

Update:

```text
scripts/validate_registry.py
scripts/build_index.py
justfile
```

Expected commands:

```text
just build-registry
just check-registry
just validate-registry
just build-index
just test
```

## Tests

Add resource metadata tests and registry drift checks:

- each `resource.yaml` parses;
- required schema fields exist;
- `resource.name` equals directory name;
- `resource.path` equals actual path;
- `resource.kind/status/risk.level/activation.mode` are valid;
- generated registry equals committed `registry.yaml`;
- `registry.yaml` has generated header;
- active skill resources have `SKILL.md` with matching frontmatter name;
- `omp-superpowers` remains explicit-only;
- incoming resources are staged/import metadata, not active skills.
