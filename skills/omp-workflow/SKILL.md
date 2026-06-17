---
name: omp-workflow
description: Use when coordinating non-trivial software work that needs workflow selection, discussion, planning, execution cadence, gates, subagent coordination, capture, or completion criteria across one or more implementation steps.
---

# OMP Workflow

## Focus

OMP Workflow owns the cadence for non-trivial software work. It selects the smallest useful workflow, preserves decisions before implementation, keeps execution bounded, and routes completed work through review, verification, capture, and ship readiness.

## Activation

Use this skill when the task involves:

- a feature, bug fix, refactor, migration, or integration that spans more than one obvious edit;
- unclear requirements, tradeoffs, or implementation choices;
- planning before implementation;
- executing an approved plan;
- coordinating subagents or independent work units;
- moving completed work through review, verification, documentation capture, or ship readiness;
- resuming a workflow where prior planning artifacts exist.

## Workflow

1. Classify the request as research, discussion, planning, execution, review, verification, capture, or shipping support.
2. Choose the lightest sufficient mode: fast, focused, or full.
3. Establish the current inputs: user goal, relevant files, constraints, existing artifacts, and required evidence.
4. Run the active phase with explicit outputs and stop conditions.
5. Apply gates at phase boundaries and route failed gates to revision, escalation, or abort.
6. Capture durable knowledge before ship readiness when the verified change alters project behavior, architecture, operations, workflow, or maintenance practice.
7. Report the completed phase, evidence observed, artifacts changed, and next concrete action.

## Rules

- Use fast mode for small, clear, low-risk edits that can be completed and verified in one pass.
- Use focused mode when a bounded plan or verification record improves correctness without creating full project state.
- Use full mode when work spans sessions, phases, requirements, substantial risk, or multiple coordinated agents.
- Keep decisions in writing before implementation when a later executor or reviewer must rely on them.
- Treat review and verification as separate gates: review judges quality and risk; verification proves behavior.
- Capture project documentation updates before ship readiness when the change creates durable project knowledge.
- Keep workflow artifacts concise and consumable by the next phase.

## Support files

| Need | Load |
| --- | --- |
| Mode selection | `references/modes.md` |
| Phase gates | `references/gates.md` |
| Discussion and planning outputs | `references/context-and-plan.md` |
| Execution cadence | `references/execution.md` |
| Capture before ship readiness | `references/capture.md` |
