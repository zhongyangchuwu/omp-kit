# OMP-First Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim the repository into a small OMP-first skill kit: keep only active skills and drafts as tracked resources, move project facts into docs, and install skills into `~/.omp/agent/skills`.

**Architecture:**
The repository should have one active capability surface: `skills/` for active skills and `drafts/` for in-progress skills. All other capability types stay out of the tracked layout until real content exists. Registry generation, validation, and index output should reflect only the active groups. The installation workflow should target OMP's native user directory instead of the old agent path. Repository docs should explain the new shape plainly and mark future capability types as roadmap material only.

**Tech Stack:** Python, YAML, Justfile, pytest, OMP docs, repository markdown docs.

---

### Task 1: Reduce resource groups to skills and drafts

**Files:**
- Modify: `scripts/resource_metadata.py`
- Modify: `scripts/validate_registry.py`
- Modify: `scripts/build_index.py`
- Modify: `schemas/resource.schema.yaml`
- Modify: `registry.yaml`
- Modify: `tests/test_resource_metadata.py`
- Modify: `tests/test_scripts.py`
- Modify: `tests/test_registry_integrity.py`

- [ ] **Step 1: Update the resource model and registry builder**

```python
RESOURCE_ROOTS = ("skills", "drafts")
REGISTRY_GROUPS = ("skills", "drafts")
KIND_TO_GROUP = {"skill": "skills"}
ALLOWED_KINDS = {"skill"}
```

Keep `registry_group()` mapping draft skill resources under `drafts`, but drop support for extension/tool/package kinds and groups.

- [ ] **Step 2: Narrow the schema**

Remove `extension`, `tool`, and `package` from `kind` enum. Remove `extensions`, `tools`, and `packages` from `relationships`. Keep only the fields still used by active skills and drafts.

- [ ] **Step 3: Regenerate the committed registry**

Run:
```bash
just build-registry
```
Expected: `registry.yaml` contains only `skills:` and `drafts:` groups.

- [ ] **Step 4: Update tests for the smaller model**

Adjust tests so they assert the registry only contains `skills` and `drafts`, the generated index only prints those groups, and the resource/file coverage test only expects active skill and draft skill metadata.

- [ ] **Step 5: Verify the registry and tests**

Run:
```bash
just test
```
Expected: the registry, schema, and metadata tests pass with the reduced resource model.

### Task 2: Move installation to OMP's native skill directory

**Files:**
- Modify: `scripts/link_skills.py`
- Modify: `justfile`
- Modify: `tests/test_link_skills.py`
- Modify: `README.md`
- Modify: `docs/workflows.md`
- Modify: `docs/architecture.md`
- Modify: `docs/omp-runtime-notes.md`

- [ ] **Step 1: Change the install target and messaging**

```python
parser = argparse.ArgumentParser(description="Link skills from the current directory into ~/.omp/agent/skills")
parser.add_argument(
    "--agent-root",
    type=Path,
    default=Path(os.environ.get("AGENT_ROOT", "~/.omp/agent")),
    help="Agent config root to receive per-skill links; default: ~/.omp/agent",
)
```

Keep the symlink behavior, force handling, and prune safety intact; only change the canonical destination.

- [ ] **Step 2: Update the justfile entry points**

Change `install` and `install-force` comments to OMP wording. Keep the commands pointed at `scripts/link_skills.py` unless a rename is also applied in code.

- [ ] **Step 3: Update install tests**

Switch expected targets from `~/.agents/skills` to `~/.omp/agent/skills`. Keep the existing safety assertions: existing symlinks are preserved, real directories are never replaced, drafts stay out of install.

- [ ] **Step 4: Rewrite user-facing docs**

Update README and workflow docs so they say the repository installs to `~/.omp/agent/skills`, remove the reserved empty directories from the layout table, and describe the repository as an OMP-first skill kit rather than a broad Pi capability workbench.

- [ ] **Step 5: Verify the install path**

Run:
```bash
just test
```
Expected: the install tests and script checks pass with the new OMP path.

### Task 3: Remove empty reserved directories and stale references

**Files:**
- Delete: `extensions/.gitkeep`
- Delete: `tools/.gitkeep`
- Delete: `packages/.gitkeep`
- Delete: `mcp/.gitkeep`
- Delete: `mcp/configs/.gitkeep`
- Delete: `vendor/.gitkeep`
- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/resource-model.md`
- Modify: `docs/workflows.md`
- Modify: `docs/omp-runtime-notes.md`
- Modify: `docs/superpowers/specs/2026-06-11-omp-first-simplification-design.md` if details shift while implementing

- [ ] **Step 1: Remove the empty directories**

Delete the tracked `.gitkeep` files so the repository no longer advertises capability roots that do not exist.

- [ ] **Step 2: Rewrite architecture and workflow docs**

Describe only the directories that remain active: `skills/`, `drafts/`, `docs/`, `scripts/`, `tests/`, `schemas/`, and `registry.yaml`. Push future extension/tool/package/MCP ideas into roadmap prose instead of tracked directories.

- [ ] **Step 3: Clean up the README and runtime notes**

Make the README and supporting docs match the smaller layout. Remove stale claims about reserved directories and any references that imply the old broad layout is active now.

- [ ] **Step 4: Verify doc consistency**

Run:
```bash
just test
```
Expected: no docs-driven tests regress, and the repository stays internally consistent.
