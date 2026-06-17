---
name: omp-planning-artifacts
description: Use when creating, updating, validating, or resuming .planning artifacts, project planning files, phase directories, PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md, CONTEXT.md, PLAN.md, SUMMARY.md, REVIEW.md, VERIFICATION.md, CAPTURE.md, or handoff files for durable workflow state.
---

# OMP Planning Artifacts

## Focus

OMP Planning Artifacts owns durable workflow state. It defines the `.planning/` structure, root project planning files, artifact lifecycle, state transitions, and handoff records that let agents and maintainers continue work without relying on conversation memory.

## Activation

Use this skill when the task involves:

- creating or changing `.planning/`;
- starting, resuming, pausing, or completing a phase;
- writing or validating phase artifacts;
- creating or validating project-level planning files (`PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`);
- updating `STATE.md`, roadmap progress, or requirement traceability;
- deciding where a workflow record belongs;
- checking whether an artifact has a consumer;
- preparing handoff context for a later session.

## Workflow

1. Identify the workflow scope: project, phase, plan, verification, capture, or handoff.
2. Select the smallest artifact set that preserves the required state.
3. Create or update artifacts using stable names and concise sections.
4. Record the consumer for each artifact.
5. Update state when the current phase, status, blocker, or next action changes.
6. Validate links, paths, required sections, and stale status before completion.

## Rules

- Store workflow state under `.planning/`.
- Keep `PROJECT.md`, `ROADMAP.md`, `REQUIREMENTS.md`, and `STATE.md` at the `.planning/` root for full phased workflows.
- Store durable project facts under `docs/`.
- Create an artifact only when a later phase, maintainer, or agent will consume it.
- Keep artifact content factual, current, and short enough to reload.
- Update `STATE.md` when workflow position changes.
- Keep phase-local records inside the phase directory.
- Use handoff records when work pauses before completion.

## Support files

| Need | Load |
| --- | --- |
| Planning tree | `references/planning-tree.md` |
| Root project artifacts | `references/root-artifacts.md` |
| Phase artifact contracts | `references/phase-artifacts.md` |
| State updates | `references/state.md` |
| Handoff records | `references/handoff.md` |
