# Import Promote Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder import/promote scripts with safe local-path workflows that create resource metadata and regenerate the generated registry.

**Architecture:** Keep `resource.yaml` canonical. Add helper functions in `scripts/resource_metadata.py` for safe tree copies, frontmatter parsing, resource metadata construction, resource writing, and registry regeneration. Implement `import_skill.py` as a local-source-to-`incoming/` copier and `promote_skill.py` as a safe copy-to-`skills/` workflow. No network download, destructive moves, or automatic high-risk activation.

**Tech Stack:** Python stdlib + PyYAML, pytest, just.

---

## File Structure

Modify:

- `scripts/resource_metadata.py`
- `scripts/import_skill.py`
- `scripts/promote_skill.py`
- `justfile`
- `README.md`
- `incoming/REVIEW.md`
- `skills/skill-authoring/references/resource-metadata.md`
- `skills/skill-authoring/references/registry-generation.md`
- `skills/skill-authoring/SKILL.md` if routing needs import/promote note

Create:

- `tests/test_import_promote.py`

## Task 1: Add Helpers

- [ ] Add `ResourceWorkflowError`.
- [ ] Add `parse_skill_frontmatter(path)` for simple SKILL.md name/description extraction.
- [ ] Add `copy_resource_tree(source, destination)` that refuses existing destinations and ignores `.git`, `__pycache__`, `.pytest_cache`, `.ruff_cache`, `.venv`.
- [ ] Add `write_resource_metadata(path, data)` using `yaml.safe_dump(sort_keys=False)`.
- [ ] Add `default_resource_metadata(...)` for import and promotion scripts.
- [ ] Add `regenerate_registry(repo_root)` that writes `registry.yaml` from current resources.

## Task 2: Implement Local Import

- [ ] `scripts/import_skill.py SOURCE --name NAME` supports local file system directories only.
- [ ] Reject missing source, non-directory source, URL-looking sources, empty/missing name.
- [ ] Copy source into `incoming/<name>`; refuse if destination exists unless a future flag is added.
- [ ] Create `incoming/<name>/resource.yaml` with:
  - `kind: incoming`
  - `status: staged`
  - `risk.level: medium`
  - `activation.mode: not-applicable`
  - source origin set to the original path
  - review notes listing required review steps
- [ ] Regenerate `registry.yaml`.
- [ ] Print copied path and registry update.

## Task 3: Implement Safe Promotion

- [ ] `scripts/promote_skill.py PATH --name NAME --activation MODE --risk LEVEL` promotes from `incoming/` or `localized/` only.
- [ ] Require `SKILL.md` in the source directory.
- [ ] Parse `SKILL.md` frontmatter name and reject mismatch with target name.
- [ ] Reject target `skills/<name>` if it exists.
- [ ] Copy source to `skills/<name>` without deleting source.
- [ ] Write or replace `skills/<name>/resource.yaml` with:
  - `kind: skill`
  - `status: active`
  - target path
  - selected risk level
  - selected activation mode
  - source origin pointing to original source path
  - verification notes for structural validation
- [ ] Regenerate `registry.yaml`.

## Task 4: Tests

- [ ] Add `tests/test_import_promote.py`.
- [ ] Test import copies a local directory into `incoming/`, creates resource metadata, and regenerates registry.
- [ ] Test import rejects existing destinations.
- [ ] Test import rejects URL-like sources.
- [ ] Test promote copies from incoming to skills, keeps incoming source, writes active resource metadata, and regenerates registry.
- [ ] Test promote rejects missing SKILL.md.
- [ ] Test promote rejects SKILL.md name mismatch.
- [ ] Test promote rejects existing active target.

## Task 5: Docs and Recipes

- [ ] Update justfile comments to remove placeholder wording.
- [ ] Update README maintenance commands with import/promote behavior.
- [ ] Update `incoming/REVIEW.md` to mention local import and safe promotion.
- [ ] Update skill-authoring references to describe workflow boundaries.

## Task 6: Verify and Commit

- [ ] Run `just build-registry`.
- [ ] Run `just check-registry`.
- [ ] Run `just validate-registry`.
- [ ] Run `just test`.
- [ ] Run `uv run --with pytest pytest skills/skill-authoring/tests/test_docs.py`.
- [ ] Run `git diff --check`.
- [ ] Commit with message `feat: implement safe import and promotion workflow`.

## Self-Review

Spec coverage: covers local import, safe promotion, registry regeneration, resource metadata integration, tests, docs, recipes, verification, and commit.

Placeholder scan: no unresolved placeholders. Network import and overwrite modes are explicitly out of scope.

Type consistency: helper names, CLI names, fields, and commands are consistent with existing scripts.
