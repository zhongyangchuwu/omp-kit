---
name: omp-design
description: Use when implementing or modifying a feature but the product behavior, user flow, interaction details, MVP scope, edge cases, states, acceptance criteria, or user-fit tradeoffs are unclear. Clarifies what the feature should do, for whom, why it matters, how it should fit user habits, what is out of scope, and how completion will be verified before or during implementation.
---

# OMP Design

## Focus

OMP Design owns product and feature design decisions before or during implementation. It turns vague feature intent into a useful, user-fit, implementable, and verifiable function definition: user/job, product behavior, scope, non-goals, reachable states, assumptions, and acceptance criteria.

## Activation

Use this skill when:

- a user asks to build or modify a feature but details are unclear;
- implementation can start technically, but product behavior is ambiguous;
- the user flow, interaction, action consequence, or state coverage is unsettled;
- an MVP risks becoming too small to be useful;
- a feature needs a brief, lightweight PRD, acceptance criteria, or product review;
- implementation discovers a product decision that cannot be answered from code.

Do not use this skill for pure implementation quality, development workflow orchestration, code review, testing mechanics, external research execution, or visual styling.

## Workflow

1. Classify the design need: clarify, brainstorm, shape, spec, states, action, harden, review, or validate.
2. Ground in available context: user goal, existing product behavior, repo conventions, and facts tools can answer.
3. Run a lightweight decision interview when needed: one decision question at a time, with a recommended answer and tradeoff.
4. Define the smallest useful product slice: user/job, core path, scope, non-goals, and success signal.
5. Design product behavior and reachable states, including failure and recovery paths.
6. Emit the smallest durable artifact needed: feature brief, PRD section, state matrix, acceptance criteria, or review findings.

## Rules

- Design for the user's job and habits before implementation convenience.
- Prefer the smallest useful slice, not the smallest technical slice.
- Complexity is not a veto; preserve core value by narrowing scope or staging delivery.
- Do not turn unconfirmed ideas into tasks, acceptance criteria, integrations, or capability promises.
- Ask one decision question at a time; include the recommended answer and tradeoff.
- Do not ask the user to confirm facts the codebase or tools can answer.
- A happy path alone is incomplete; cover empty, loading, error, permission, destructive, and recovery states when relevant.
- Record accepted decisions separately from open questions and rejected options.
- Acceptance criteria must be observable from user behavior or system output.

## Support files

| Need | Load |
| --- | --- |
| Feature ambiguity or user-visible scope decisions | `references/decision-interview.md` |
| Open-ended feature direction or multiple possible approaches | `references/brainstorm.md` |
| Turning intent into a compact feature definition | `references/feature-brief.md` |
| Writing a PRD or requirements section | `references/prd.md` |
| Designing flows, actions, consequences, and states | `references/interaction-states.md` |
| Avoiding useless MVPs and staging useful delivery | `references/useful-slice.md` |
| Reviewing an existing feature, spec, or product behavior | `references/product-review.md` |
| Testing whether a product direction is worth building | `references/validation.md` |
