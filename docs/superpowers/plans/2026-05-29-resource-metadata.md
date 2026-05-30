# Resource Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make resource-local `resource.yaml` files the canonical metadata source and generate committed `registry.yaml` from them.

**Architecture:** Add a focused `scripts/resource_metadata.py` module for schema validation, scanning, and registry generation. `scripts/build_registry.py` writes or checks the generated `registry.yaml`; existing validation and index scripts consume the same metadata-derived model. Tests verify schema, registry drift, and active skill invariants.

**Tech Stack:** Python stdlib + PyYAML, pytest, just.

---

## File Structure

Create:

- `skills/autodl/resource.yaml`
- `skills/skill-authoring/resource.yaml`
- `skills/omp-superpowers/resource.yaml`
- `incoming/anthropic-skills/resource.yaml`
- `incoming/claude-plugins-official/resource.yaml`
- `incoming/superpowers/resource.yaml`
- `scripts/resource_metadata.py`
- `scripts/build_registry.py`
- `tests/test_resource_metadata.py`
- `skills/skill-authoring/references/resource-metadata.md`
- `skills/skill-authoring/references/registry-generation.md`
- `skills/skill-authoring/assets/resource-template.yaml`

Modify:

- `registry.yaml`
- `scripts/validate_registry.py`
- `scripts/build_index.py`
- `justfile`
- `incoming/REVIEW.md`
- `skills/skill-authoring/SKILL.md`
- `skills/skill-authoring/tests/test_docs.py`
- `tests/test_registry_integrity.py`
- `tests/test_scripts.py`
- `docs/architecture.md`

## Task 1: Add Resource Metadata Files

- [ ] Create `resource.yaml` for all existing resources listed above.
- [ ] Include `name`, `kind`, `status`, `path`, `source`, `risk`, `activation`, `verification`, `maintenance`, and `relationships`.
- [ ] Preserve previous registry details in resource-local metadata:
  - AutoDL source/risk/verification.
  - skill-authoring source/risk/verification.
  - omp-superpowers source/upstream/import/localization/explicit-only/verification notes.
  - incoming collection source/risk/review notes.
- [ ] Ensure `resource.name` equals directory name.
- [ ] Ensure `resource.path` equals the resource directory path.

## Task 2: Implement Metadata Loader and Registry Builder

- [ ] Add `scripts/resource_metadata.py` with:
  - constants for resource roots and allowed values;
  - `ResourceIssue` dataclass;
  - `load_resource_file(path)`;
  - `discover_resources(repo_root)`;
  - `validate_resource(resource, repo_root)`;
  - `build_registry(resources)`;
  - `format_registry(registry)` with generated header.
- [ ] Add `scripts/build_registry.py` with:
  - default mode: write `registry.yaml`;
  - `--check`: compare generated content to committed file and return non-zero on drift.

## Task 3: Wire Existing Scripts and justfile

- [ ] Update `scripts/validate_registry.py` so it validates the committed generated registry and checks it matches metadata-derived output.
- [ ] Update `scripts/build_index.py` to tolerate the generated header and continue printing compact index output.
- [ ] Add just recipes:
  - `build-registry`
  - `check-registry`
- [ ] Keep `validate-registry`, `build-index`, `scan-risk`, and `test` intact.

## Task 4: Update Documentation and Skill Authoring References

- [ ] Replace `incoming/REVIEW.md` with an index/orientation page pointing to per-resource `resource.yaml` files.
- [ ] Add `skills/skill-authoring/references/resource-metadata.md` explaining schema and ownership.
- [ ] Add `skills/skill-authoring/references/registry-generation.md` explaining generated registry workflow.
- [ ] Add `skills/skill-authoring/assets/resource-template.yaml`.
- [ ] Update `skills/skill-authoring/SKILL.md` reference routing.
- [ ] Update `docs/architecture.md` registry section to state `resource.yaml` is canonical and `registry.yaml` is generated.

## Task 5: Update Tests

- [ ] Add `tests/test_resource_metadata.py` covering parseability, required fields, path/name consistency, allowed values, generated registry equality, and generated header.
- [ ] Update `tests/test_registry_integrity.py` to rely on metadata-derived validation and keep active skill/Superpowers invariants.
- [ ] Update `tests/test_scripts.py` for `build_registry.py --check` and generated index behavior.
- [ ] Update `skills/skill-authoring/tests/test_docs.py` so new references and resource template are required.

## Task 6: Verify and Commit

- [ ] Run `just build-registry`.
- [ ] Run `just check-registry`.
- [ ] Run `just validate-registry`.
- [ ] Run `just test`.
- [ ] Review `git status --short` and `git diff --check`.
- [ ] Commit with message: `feat: make resource metadata canonical`.

## Self-Review

Spec coverage: covers resource metadata, generated registry, incoming review replacement, skill-authoring reference updates, scripts, tests, verification, and commit.

Placeholder scan: this plan intentionally has no unresolved placeholders. Scaffolded future import/promote behavior is outside this work.

Type consistency: resource fields and script names are consistent across tasks.
