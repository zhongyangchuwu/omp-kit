---
name: omp-workflow
description: Use when coordinating development workflow orchestration: project initialization, codebase exploration, phase lifecycle, mode selection, planning and execution cadence, gates, subagent coordination, verification routing, capture, release, or ship readiness across one or more implementation steps.
---

# OMP Workflow

## Focus

OMP Workflow owns development process orchestration. It defines the phase lifecycle, selects the smallest useful workflow mode, detects whether project initialization or codebase exploration is needed, keeps planning and execution bounded, coordinates agents, applies gates, and routes completed work through review, verification, capture, and ship readiness. It does not own product or feature design decisions; those belong in the feature/design concern before workflow planning turns them into executable work.

## Activation

Use this skill when the task involves:

- a feature, bug fix, refactor, migration, or integration that needs explicit development workflow coordination;
- detecting that project planning state is missing and initialization or codebase exploration is needed;
- workflow-level ambiguity about phase selection, planning scope, execution order, coordination, review, verification, or release gates;
- planning before implementation after the product or technical objective is clear enough to execute;
- executing an approved plan;
- coordinating subagents or independent work units;
- moving completed work through review, verification, documentation capture, release archiving, or ship readiness;
- resuming a workflow where prior planning artifacts exist;
- completing finished phases as a published release and archiving their planning history.

## Workflow

1. Detect project state: missing `.planning/` with existing code → codebase exploration; missing `.planning/` in empty repo → project initialization; `.planning/` present → classify the request as discussion, planning, execution, review, verification, capture, or shipping support.
2. Choose the lightest sufficient mode: fast, focused, or full.
3. Establish the current inputs: clarified goal, relevant files, constraints, existing artifacts, and required evidence.
4. Run the active workflow phase with explicit outputs and stop conditions.
5. Apply gates at phase boundaries and route failed gates to revision, escalation, or abort.
6. Capture durable knowledge before ship readiness when the verified change alters project behavior, architecture, operations, workflow, or maintenance practice.
7. Report the completed phase, evidence observed, artifacts changed, and next concrete action.

## Rules

- Use fast mode for small, clear, low-risk edits that can be completed and verified in one pass.
- Use focused mode when a bounded plan or verification record improves correctness without creating full project state.
- Use full mode when work spans sessions, phases, requirements, substantial risk, or multiple coordinated agents.
- Keep workflow decisions in writing before implementation when a later executor or reviewer must rely on them.
- Treat review and verification as separate gates: review judges quality and risk; verification proves behavior.
- Capture project documentation updates before ship readiness when the change creates durable project knowledge.
- Require confirmation before workflow planning treats new features, breaking changes, scope expansion, user-visible behavior changes, or capability promises as accepted scope.
- Bug fixes and local refactors may proceed from observed code facts without confirmation when they preserve intended behavior and scope.
- Use a lightweight decision interview for workflow ambiguity: ask one decision question at a time, include a recommended answer, and do not replace dialogue with a large approval checklist.
- If ambiguity is about user-visible feature behavior, product scope, user flow, or acceptance criteria, resolve the product/design decision before workflow planning turns it into tasks.
- Keep workflow artifacts concise and consumable by the next phase.

## Support files

| Need | Load |
| --- | --- |
| Project initialization | `references/initialization.md` |
| Codebase exploration | `references/codebase-exploration.md` |
| Phase lifecycle | `references/phase-lifecycle.md` |
| Mode selection | `references/modes.md` |
| Phase gates | `references/gates.md` |
| Discussion and planning outputs | `references/context-and-plan.md` |
| Execution cadence | `references/execution.md` |
| Capture before ship readiness | `references/capture.md` |
| Release and archive workflow | `references/release.md` |
