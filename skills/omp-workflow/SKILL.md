---
name: omp-workflow
description: Use when coordinating development workflow orchestration: project initialization, codebase exploration, phase lifecycle, mode selection, planning and execution cadence, delegation, subagent context, gates, verification routing, capture, release, or ship readiness across one or more implementation steps.
---

# OMP Workflow

## Focus

OMP Workflow owns development process orchestration. It selects the lightest useful workflow, coordinates persistent workers, controls context transfer and escalation, applies gates, and routes completed work through review, verification, capture, and ship readiness. It does not own product or feature design decisions; those belong in the feature/design concern before workflow planning turns them into executable work.

Durable planning artifacts are used when state must survive across sessions, people, or long-running phases. Do not create a heavy `.planning/` lifecycle merely because a task touches many files if the work can be completed and verified coherently in one session.

## Activation

Use this skill when the task involves:

- a feature, bug fix, refactor, migration, or integration that needs explicit development workflow coordination;
- detecting that durable project planning state is missing when the work genuinely needs multi-session continuity;
- workflow-level ambiguity about phase selection, planning scope, execution order, coordination, review, verification, or release gates;
- planning before implementation after the product or technical objective is clear enough to execute;
- executing an approved plan;
- coordinating subagents or independent work units;
- deciding how a worker should obtain parent-conversation context;
- moving completed work through review, verification, documentation capture, release archiving, or ship readiness;
- resuming a workflow where prior planning artifacts exist;
- completing finished phases as a published release and archiving their planning history.

## Workflow

1. Classify the request: direct execution, coordinated execution, durable multi-session work, review, verification, capture, or shipping support.
2. Choose the lightest sufficient workflow mode and avoid creating durable artifacts unless they serve future continuity.
3. Establish current intent, boundaries, repository facts, and required evidence.
4. Decide whether work should remain with the director or be delegated. For delegated work, load the delegation and subagent-context policies.
5. Run the active work with explicit stop conditions and bounded repair.
6. Apply gates at meaningful boundaries and route failed gates to revision, escalation, specification refinement, or user clarification.
7. Capture durable knowledge before ship readiness when the verified change alters project behavior, architecture, operations, workflow, or maintenance practice.
8. Report evidence, artifacts changed, unresolved risk, and the next concrete action.

## Rules

- Preserve user intent and correctness before optimizing cost or speed.
- Subject to correctness, minimize human intervention, expensive-model work, duplicated exploration, and unnecessary parallelism.
- The director owns intent interpretation, decomposition, interfaces, acceptance criteria, escalation, and integration decisions; workers own scoped exploration, implementation, local debugging, and targeted verification.
- Verification by the director does not mean redoing a worker's complete investigation.
- Choose one initial worker tier per workstream. Do not routinely run multiple worker tiers on the same problem for confidence alone.
- Reuse a persistent worker for follow-up work on the same coherent workstream when its context remains relevant.
- Prefer workers pulling authoritative context themselves over the director rewriting long context into each task brief.
- Conversation is evidence, not automatically a specification. Never turn tentative or rejected discussion into implementation requirements.
- Use fast mode for small, clear, low-risk edits that can be completed and verified in one pass.
- Use focused mode when a bounded plan or verification record improves correctness without creating full project state.
- Use full mode when work genuinely spans sessions, phases, requirements, substantial risk, or multiple coordinated agents.
- Treat review and verification as separate gates: review judges quality and risk; verification proves behavior.
- Capture project documentation updates before ship readiness when the change creates durable project knowledge.
- Require user confirmation before workflow planning treats new features, breaking changes, scope expansion, user-visible behavior changes, or capability promises as accepted scope.
- Bug fixes and local refactors may proceed from observed code facts without confirmation when they preserve intended behavior and scope.
- If ambiguity is about user-visible feature behavior, product scope, user flow, or acceptance criteria, resolve the product/design decision before workflow planning turns it into tasks.
- Keep workflow artifacts concise and consumable by the next phase or worker.

## Support files

| Need | Load |
| --- | --- |
| Project initialization | `references/initialization.md` |
| Codebase exploration | `references/codebase-exploration.md` |
| Phase lifecycle | `references/phase-lifecycle.md` |
| Mode selection | `references/modes.md` |
| Phase gates | `references/gates.md` |
| Discussion and planning outputs | `references/context-and-plan.md` |
| Delegation, worker selection, persistence, escalation | `references/delegation.md` |
| Parent/worker context transfer and `history://` policy | `references/subagent-context.md` |
| Execution cadence | `references/execution.md` |
| Capture before ship readiness | `references/capture.md` |
| Release and archive workflow | `references/release.md` |
