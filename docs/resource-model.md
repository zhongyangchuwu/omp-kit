# Resource Model

Every tracked skill or draft owns a `resource.yaml` file. `registry.yaml` is generated from these files and is never edited by hand.

Top-level `references/` is the exception: it is local, gitignored source material for upstream repositories, books, downloaded docs, and other external references. It is intentionally outside the resource model.

## Schema

Resource metadata is validated against `schemas/resource.schema.yaml` using JSON Schema 2020-12. Keep field-shape changes in that schema first, then update examples, resource files, and tests.

For YAML language-server support, map `schemas/resource.schema.yaml` to:

```text
skills/*/resource.yaml
drafts/*/resource.yaml
```

The schema handles required fields, types, enums, and nested source-reference shapes. Repository-specific invariants remain in `scripts/resource_metadata.py`: resource `name` must match the directory, `path` must match the actual path and exist, draft resources must live under `drafts/`, and generated registry keys must be unique.

## resource.yaml

### Where it lives

```text
skills/<name>/resource.yaml
drafts/<name>/resource.yaml
```

Draft skill metadata uses `kind: skill` and `status: draft`; active skill metadata uses `kind: skill` and `status: active`.

### Example

```yaml
name: code-taste
kind: skill
status: draft
path: drafts/code-taste

source:
  type: upstream-derived
  origin: references/compound-engineering-plugin
  references:
    - label: compound-engineering-plugin
      path: references/compound-engineering-plugin
      repository: https://github.com/EveryInc/compound-engineering-plugin.git
      branch: main
      commit: 85987d496fdfdc8a18faf592fd53329e23266537
  imported: null
  promoted: null
  notes:
    - Reference sources informed this draft but do not define its activation policy or local design.

risk:
  level: low
  reason: Instruction-only code quality guidance.

activation:
  mode: not-applicable
  notes: Draft skill; not active.

verification:
  commands:
    - just test
  notes:
    - Validate metadata and generated registry.

maintenance:
  last_reviewed: "2026-05-31"
  notes:
    - Keep this skill focused on code-level judgment.

relationships:
  upstream:
    - references/compound-engineering-plugin
```

### Field reference

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | Kebab-case name matching the resource directory. |
| `kind` | enum | yes | Currently only `skill`. |
| `status` | enum | yes | `active`, `draft`, or `archived`. |
| `path` | string | yes | Repo-relative path to the resource directory; must match actual location. |
| `source.type` | string | yes | `self`, `upstream-derived`, `promoted-local`, or another explicit classifier. |
| `source.origin` | string\|null | yes | Human-readable primary origin. May be a local path, multiple paths, or null for self-authored resources. |
| `source.references` | list | yes | Reference inputs that informed this resource. These are provenance/reference records, not obligations to follow upstream design. |
| `source.references[].label` | string | yes | Short source label. |
| `source.references[].path` | string\|null | yes | Local source path when present. |
| `source.references[].repository` | string\|null | yes | Upstream repository URL when known. |
| `source.references[].branch` | string\|null | yes | Source branch when known from a git checkout. |
| `source.references[].commit` | string\|null | yes | Source commit when known from a git checkout. Never fabricate; use null when the retained source is not tied to a verified commit. |
| `source.imported` | string\|null | yes | ISO date when material was first copied or recorded. |
| `source.promoted` | string\|null | yes | ISO date when a draft/resource was promoted to active. |
| `source.notes` | list[string] | yes | Free-form provenance notes. |
| `risk.level` | enum | yes | `low`, `medium`, `high`. |
| `risk.reason` | string | yes | Human-readable risk rationale. |
| `activation.mode` | enum | yes | `automatic`, `explicit-only`, `manual`, `not-applicable`. |
| `activation.notes` | string | yes | When or whether the agent should activate this resource. Draft resources use `not-applicable`. |
| `verification.commands` | list[string] | yes | Commands runnable from the repository root. |
| `verification.notes` | list[string] | yes | Additional verification guidance. |
| `maintenance.last_reviewed` | string | yes | ISO date of last review. |
| `maintenance.notes` | list[string] | yes | Free-form maintenance notes. |
| `relationships.upstream` | list[string] | yes | Links to related upstream or local reference paths. |

## Reference provenance semantics

`source.references` records where ideas, source text, or implementation patterns came from. It does not mean the local resource remains semantically aligned with that upstream. A local skill can deliberately diverge after review.

When a reference is a git checkout under `references/`, record:

```bash
git -C references/<name> remote --verbose
git -C references/<name> branch --show-current
git -C references/<name> rev-parse HEAD
```

Use `null` for `branch` or `commit` when the source is vendored, copied from a cache, or otherwise not tied to a verified git revision.

## registry.yaml

Generated by `scripts/build_registry.py`. Starts with a header marking it as generated. Contains only three fields per entry:

```yaml
# Generated by scripts/build_registry.py. Do not edit manually.

skills:
  autodl:
    status: active
    risk: high
    path: skills/autodl
```

## Activation modes

| Mode | Behavior |
| --- | --- |
| `automatic` | Agent loads the resource when the task matches its description. |
| `explicit-only` | Agent loads the resource only when the user explicitly asks for it by name or workflow. |
| `manual` | Reserved for human-initiated loading. |
| `not-applicable` | Draft or inactive resources that are not activated. |

Use `explicit-only` for skills whose descriptions are too broad and would auto-trigger on unrelated tasks.

## Risk levels

| Level | Criteria |
| --- | --- |
| Low | Instruction-only. No scripts, secrets, network, SSH, billing, or destructive operations. |
| Medium | May contain local scripts or tooling. No secrets, billing, SSH, or external writes. |
| High | Secrets, network services, SSH, paid/cloud resources, billing, deletion, stopping, or external writes. |

High-risk resources should not be auto-linked without review. Prefer explicit confirmation for destructive actions, dry-run support, and clear audit output.
