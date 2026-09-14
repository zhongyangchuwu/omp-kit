# Context and Plan Outputs

## Lifetime boundary

Do not create durable planning artifacts merely to duplicate an active OMP session.
The session transcript already records discussion for same-session retrieval through
`history://<agent-id>`.

Create or update durable context when accepted project state must survive a new OMP
session, handoff, long-lived phase, or deliberate planning workflow. Materialize the
current state, not the conversation transcript.

A useful distinction is:

- session history = how the current session got here;
- durable planning = what future sessions need to treat as current project state.

Do not create a default `SESSION.md` mirror of history. If full transcripts are ever
archived for audit/provenance, keep them outside active planning state and do not make
normal workers read them by default.

## Context output

Create a context record when implementation depends on durable decisions that are easy
to forget or reinterpret across sessions or handoffs.

A useful context record contains:

- goal;
- constraints;
- accepted decisions;
- rejected options when their exclusion matters;
- open questions;
- canonical repository/document references;
- verification expectations.

Keep the context record factual and current. Record chosen decisions and unresolved
questions separately. Summarize only the durable state needed going forward; do not
copy exploratory dialogue, transient tool output, or the full session transcript.

If provenance matters, reference the relevant evidence when it is durable and
resolvable, but do not make a cross-session plan depend solely on a session-local
history URI.

## Discussion output

For ambiguous workflow planning work, use a lightweight decision interview instead of
a large up-front checklist. The active discussion may remain in session history until
there is a reason to materialize durable state.

Decision interview rules:

- Ask one decision question at a time.
- Include a recommended answer and the tradeoff behind it.
- Confirm new features, breaking changes, scope expansion, user-visible behavior
  changes, and capability promises before workflow planning treats them as accepted
  scope.
- Do not ask the user to confirm facts the codebase can answer with targeted lookup.
- Explore only enough code to answer the current decision or locate the relevant
  implementation.
- If targeted discovery is difficult, record that as a maintainability concern rather
  than continuing broad exploration.
- Bug fixes and local refactors may proceed from observed code facts when they preserve
  intended behavior and scope.
- Record accepted decisions separately from open questions and rejected options when
  durable context is materialized.

A plan must not turn unconfirmed ideas into tasks, acceptance criteria, integrations,
compatibility promises, or user-visible capabilities. If the unresolved ambiguity is
about product behavior, product scope, user flow, or acceptance criteria, resolve the
feature/design decision before writing the workflow plan.

## Plan output

Create a plan when implementation has multiple steps, dependencies, or verification
requirements and the workflow has deliberately entered planning mode.

A useful plan contains:

- objective;
- scope;
- non-goals;
- inputs read;
- tasks;
- affected files or symbols when known;
- acceptance criteria;
- verification steps;
- dependencies and safe parallelization points;
- risks and escalation points.

Each task must be executable without reinterpreting the goal.

## Plan quality check

A plan is ready when another agent in a fresh session can identify what to change,
what to leave untouched, how to verify the result, and what to do when a gate fails.
