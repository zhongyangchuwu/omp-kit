---
name: omp-planning-artifacts
description: Use when the project explicitly selects or already uses a .planning phase dossier and needs its planning files, phase directories, state, verification, release or handoff artifacts created, updated, validated or resumed. Do not select this workflow merely because an ordinary project needs a plan, a review, or cross-session recovery.
---

# OMP Planning Artifacts

## Focus

This maintained specialized Skill owns the `.planning/` structure when a project deliberately chooses a local/offline phase dossier. It preserves root planning files, phase state, traceability and handoff records without relying on conversation memory.

Ordinary issue-centered projects use current docs, `WORKING_STATE.md`, Issues and PRs. The presence of this Skill does not authorize creating a parallel dossier or moving accepted design knowledge out of `docs/`.

## Activation

Within an explicitly selected or existing `.planning/` workflow, use this Skill for:

- creating or changing `.planning/`;
- starting, resuming, pausing, or completing a phase;
- writing or validating phase artifacts;
- creating project-level `PROJECT.md`, `ROADMAP.md`, and `REQUIREMENTS.md`;
- updating `STATE.md`, roadmap progress, or requirement traceability;
- choosing the owner of a phase record;
- release archive artifacts needed by that project's dossier;
- checking artifact consumers and preparing a later-session handoff.

## Workflow

1. Confirm the selected workflow scope: project, phase, plan, verification, capture, or handoff.
2. Select the smallest artifact set that preserves the required state.
3. Create or update artifacts using stable names and concise sections.
4. Record the consumer for each artifact.
5. Update state when the current phase, status, blocker, or next action changes.
6. Validate links, paths, required sections, and stale status before completion.

## Rules

- Store the selected phase workflow's state under `.planning/`, not all project knowledge.
- Keep `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, and `STATE.md` at its root for full phased workflows.
- Store accepted durable project facts and design decisions under `docs/`.
- Create an artifact only when a later phase, maintainer, or agent will consume it.
- Keep artifact content factual, current, and short enough to reload.
- Update `STATE.md` when workflow position changes.
- Keep phase-local records inside the phase directory.
- Use handoff records when they preserve useful unfinished context.
- Do not infer that removing omp-kit's historical `docs/archive/` also removes a user's explicitly chosen `.planning/` workflow.

## Support files

| Need | Load |
| --- | --- |
| Planning tree | `references/planning-tree.md` |
| Root project artifacts | `references/root-artifacts.md` |
| Phase artifact contracts | `references/phase-artifacts.md` |
| State updates | `references/state.md` |
| Handoff records | `references/handoff.md` |
| Release archive artifacts | `references/release-artifacts.md` |
