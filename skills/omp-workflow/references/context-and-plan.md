# Context and Plan Outputs

## Context output

Create a context record when implementation depends on decisions that are easy to forget or reinterpret.

A useful context record contains:

- goal;
- constraints;
- decisions;
- rejected options;
- open questions;
- canonical references;
- verification expectations.

Keep the context record factual. Record chosen decisions and unresolved questions separately.

## Discussion output

For ambiguous design or planning work, use a lightweight decision interview instead of a large up-front checklist.

Decision interview rules:

- Ask one decision question at a time.
- Include a recommended answer and the tradeoff behind it.
- Confirm new features, breaking changes, scope expansion, user-visible behavior changes, and capability promises before treating them as scope.
- Do not ask the user to confirm facts the codebase can answer with targeted lookup.
- Explore only enough code to answer the current decision or locate the relevant implementation.
- If targeted discovery is difficult, record that as a maintainability concern rather than continuing broad exploration.
- Bug fixes and local refactors may proceed from observed code facts when they preserve intended behavior and scope.
- Record accepted decisions separately from open questions and rejected options.

A plan must not turn unconfirmed ideas into tasks, acceptance criteria, integrations, compatibility promises, or user-visible capabilities.

## Plan output

Create a plan when implementation has multiple steps, dependencies, or verification requirements.

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

A plan is ready when another agent can identify what to change, what to leave untouched, how to verify the result, and what to do when a gate fails.
