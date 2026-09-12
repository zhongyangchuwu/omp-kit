---
name: omp-workflow
description: "Coordinate multi-step development, custom task agents, parent-context retrieval, execution, escalation, verification and durable project handoffs."
---

# OMP Workflow

Own workflow coordination, not every task's implementation procedure. Product
choices belong to the user/design concern before becoming implementation scope.
Keep the active workflow small; load only the reference needed for the current step.

## Route the work

1. Establish intent, boundaries and observable completion. Ask about material product
   ambiguity, not ordinary implementation details inferable from repository conventions.
2. Use direct execution for trivial work. For delegation load `references/delegation.md`
   and `references/subagent-context.md`; select a discovered custom agent by task shape.
3. Let workers retrieve relevant context and perform scoped work. Reuse the owner of
   a coherent workstream and avoid duplicated exploration or overlapping writes.
4. Verify critical evidence and integrated behavior. Use independent strong review
   when failure cost warrants it, not after every small edit.
5. Preserve decisions and state only when future sessions or people need them.
   Missing `.planning/` alone is not a reason to initialize a planning framework.
6. Report completed work, evidence, limitations and material unresolved decisions.

## References

| Situation | Load |
| --- | --- |
| Custom agents, waiting, ownership, escalation | `references/delegation.md` |
| Worker brief vs history retrieval, authority, notes | `references/subagent-context.md` |
| Execution and verification ownership | `references/execution.md` |
| Built-in `/vibe` used explicitly | `references/vibe-compat.md` |
| Workflow mode selection | `references/modes.md` |
| Durable multi-session phase state | `references/phase-lifecycle.md` |
| Deliberate project initialization | `references/initialization.md` |
| Bounded codebase exploration | `references/codebase-exploration.md` |
| Accepted context and a written plan | `references/context-and-plan.md` |
| Meaningful phase gates | `references/gates.md` |
| Durable documentation capture | `references/capture.md` |
| Release/archive work explicitly requested | `references/release.md` |

For a one-session delegated change, do not load the entire durable phase lifecycle.
Existing full-mode references apply only after that mode has been deliberately chosen.
