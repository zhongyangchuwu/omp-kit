---
name: omp-planning-artifacts
description: Use when the project explicitly selects or already uses a .planning phase dossier and needs its planning files, phase lifecycle, brownfield codebase map, state, verification, release or handoff artifacts created, updated, validated or resumed. Do not select this workflow merely because an ordinary project needs a plan, a review, or cross-session recovery.
---

# OMP Planning Artifacts

## Focus

This maintained specialized Skill owns the `.planning/` structure and lifecycle when a project deliberately chooses a local/offline phase dossier. It preserves root planning files, phase state, traceability, optional reusable codebase maps, and handoff/release records without relying on conversation memory.

Ordinary issue-centered projects use current docs plus task-local Issues and PRs when useful. The presence of this Skill does not authorize creating a parallel dossier or moving accepted design knowledge out of `docs/`.

## Activation

Within an explicitly selected or existing `.planning/` workflow, use this Skill for:

- creating or changing `.planning/`;
- starting, resuming, pausing, or completing a phase;
- writing or validating phase artifacts;
- creating project-level `PROJECT.md`, `ROADMAP.md`, and `REQUIREMENTS.md`;
- updating `STATE.md`, roadmap progress, or requirement traceability;
- mapping a brownfield codebase into `.planning/codebase/` when later planning work will reuse the map;
- choosing the owner of a phase record;
- release archive artifacts needed by that project's dossier;
- checking artifact consumers and preparing a later-session handoff.

## Workflow

1. Confirm that `.planning/` mode is explicitly selected or already in use; do not bootstrap it from project size alone.
2. Identify the current workflow scope: root project state, codebase map, phase discussion/plan/execution/verification, pause/resume, or release/archive.
3. Select the smallest artifact set that preserves state a real later consumer needs.
4. Create or update artifacts using stable names and concise sections.
5. Update `STATE.md` and cross-file traceability only when workflow position or accepted facts actually change.
6. Validate links, paths, required sections, stale observations, and consumer ownership before completion.

## Rules

- Store the selected phase workflow's state under `.planning/`, not all project knowledge.
- Keep `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, and `STATE.md` at its root for full phased workflows.
- Store accepted durable project facts and design decisions under normal project docs.
- Create an artifact only when a later phase, maintainer, or agent will consume it.
- Keep artifact content factual, current, and short enough to reload.
- Use normal `omp-workflow` routing/delegation/verification policy; this Skill does not create another orchestration layer.
- Update `STATE.md` when workflow position changes.
- Keep phase-local records inside the phase directory.
- Use handoff records only when they preserve useful unfinished context.
- Do not infer that removing omp-kit's historical `docs/archive/` or global state mirror removes a user's explicitly chosen `.planning/` workflow.

## Support files

| Need | Load |
| --- | --- |
| Planning tree | `references/planning-tree.md` |
| Root project artifacts and synchronization | `references/root-artifacts.md` |
| Phase lifecycle and transitions | `references/phase-lifecycle.md` |
| Brownfield reusable codebase mapping | `references/codebase-exploration.md` |
| Phase artifact contracts | `references/phase-artifacts.md` |
| State updates | `references/state.md` |
| Handoff records | `references/handoff.md` |
| Release archive artifacts | `references/release-artifacts.md` |
