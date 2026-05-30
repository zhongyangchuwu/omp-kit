# Resource Metadata

Use `resource.yaml` for parseable resource-local metadata. Top-level `registry.yaml` is generated from these files and must not be edited by hand.

## Location

Every tracked resource directory owns one metadata file:

```text
skills/<name>/resource.yaml
extensions/<name>/resource.yaml
tools/<name>/resource.yaml
packages/<name>/resource.yaml
incoming/<name>/resource.yaml
```

## Schema

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

- `name` matches the resource directory name.
- `kind` is one of `skill`, `extension`, `tool`, `package`, `incoming`, or `import`.
- `status` is one of `active`, `staged`, `localized`, `archived`, or `draft`.
- `path` is repo-relative and points to the owning directory.
- `risk.level` is `low`, `medium`, or `high`.
- `risk.reason` explains the operational risk in human terms.
- `activation.mode` is `automatic`, `explicit-only`, `manual`, or `not-applicable`.
- `verification.commands` contains commands that can be run from the repository root.
- `maintenance.last_reviewed` is an ISO date string.
- `relationships` records future links between skills, extensions, tools, packages, and upstream sources.

## Ownership

`resource.yaml` is the source of truth for detailed resource metadata. Put source, risk rationale, activation policy, verification commands, and maintenance notes here rather than in top-level `registry.yaml`.
