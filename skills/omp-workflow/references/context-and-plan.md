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

For ambiguous design or planning work, inspect context first, ask one decision at a time, present concrete options with tradeoffs, recommend a default, and record the accepted decision.


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
