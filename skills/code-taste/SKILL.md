---
name: code-taste
description: Use when implementing, refactoring, simplifying, or reviewing code where maintainability, API shape, error handling, test quality, performance discipline, or abstraction boundaries matter. Prefer this over generic clean-code or design-pattern advice when the goal is practical code quality.
---

# Code Taste

Use this skill to keep code boring, explicit, efficient, and easy to change. It is not a formatter and not a design-pattern catalog. It is a judgment layer for implementation and review.

## Boundary

Use this skill for:

- implementation choices that affect future maintainability;
- refactors or simplification passes;
- API and exported type changes;
- error-handling and state-transition design;
- tests that risk proving mocks or implementation details instead of behavior;
- performance-sensitive paths or changes that add repeated work, allocation, I/O, or shared state.

Do not use it for:

- formatting, import order, or lint-only cleanup;
- framework-specific API syntax questions; use current docs for those;
- full system architecture or RFC work; use a system-design skill when available;
- broad design-pattern education detached from code being changed.

## Operating principle

Make the code easier to reason about six months from now. Delete concepts before rearranging them. Add an abstraction only when it reduces the number of ideas a maintainer must hold today. In MVP-stage personal projects, do not fear behavior-preserving refactors that clarify architecture or reduce future friction; use git as rollback support, but still verify exposed contracts.

## Review sequence

1. **Purpose** — state what the changed code must do now. Ignore speculative future needs.
2. **Existing shape** — inspect nearby code and established helpers before adding names, types, files, or patterns.
3. **Correctness** — trace representative and boundary inputs through branches, state changes, errors, and side effects.
4. **Simplicity** — remove or inline unearned wrappers, flags, parameters, modes, and one-off extension points.
5. **Contracts** — preserve public API semantics, response shapes, error shapes, and exported type expectations unless the caller has explicitly accepted a breaking change.
6. **Tests** — prefer black-box contract tests for exposed behavior, invariants, and critical error paths; avoid tests that only prove mocks, plumbing, private implementation, or current defaults.
7. **Efficiency** — check hot paths for repeated work, avoidable allocation, unbounded loading, blocking I/O, and lifecycle leaks.
8. **Verification** — match checks to project stage and blast radius. Broaden verification for public contracts, data, security, concurrency, deployment, or irreversible operations.

## Decision rules

### Abstractions

- One implementation behind an interface is speculative unless the interface is required by a framework or public boundary.
- A helper used once must earn its name by isolating a real concept, not just by shortening a function.
- A new config option, plugin hook, strategy object, or factory needs a current consumer.
- Prefer explicit branches over a generic dispatch system until the variation axis is stable.
- If a refactor moves the same complexity across more files without deleting concepts, it failed.

### API shape

- Public inputs and outputs are contracts. Treat renamed fields, changed nullability, altered status codes, changed sort order, and new required parameters as breaking until proven otherwise.
- Additive optional fields are usually safe; mutating or removing existing semantics is not.
- Keep error shapes consistent across an API surface.
- Do not leak internal implementation details through public names or types.

### Error handling

- Catch errors only where the code can add context, recover, translate to a stable contract, or clean up.
- Do not convert failures into empty data unless “empty” is truly the domain result.
- Preserve causal context when wrapping errors.
- Validate inputs at boundaries; do not scatter defensive checks for impossible states.
- Cleanup belongs with the code that owns the resource lifecycle.

### State and concurrency

- Avoid redundant state that can be derived from existing state.
- Every async operation that can outlive its caller needs cancellation, ordering, or stale-result handling.
- Shared mutable state needs an owner and a synchronization story.
- State transitions must update related fields together or fail without partial commits.

### Tests

- Test externally meaningful behavior and invariants, not internal call counts unless the calls are the behavior.
- Prefer black-box tests at public boundaries. White-box tests are justified for complex algorithms, parsers/serializers, migrations, security-sensitive normalization, tricky state machines, or performance-critical functions with stable internal contracts.
- Do not add production methods used only by tests; put cleanup and fixtures in test utilities.
- Mock only the slow, external, or nondeterministic boundary. Preserve side effects the behavior under test depends on.
- Mock data must match the real shape consumed downstream.
- Edge cases should target real contract boundaries: empty, singleton, maximum, exact page size, nullability, retries exhausted, cancellation, partial failure.
- Do not chase coverage numbers or exhaustive internal tests in low-risk MVP work; add regression tests for bugs that were actually found.

### Efficiency

- Do not allocate, copy, parse, stringify, compile regexes, read files, or hit network/storage repeatedly when the result can be reused safely.
- Avoid unbounded reads and unbounded in-memory collections on user/data-sized inputs.
- Do not pre-check resource existence when the operation itself can fail; operate directly and handle the error to avoid TOCTOU races.
- Caching is complexity. Add it only when the path is demonstrably repeated or expensive and invalidation is clear.
- Micro-optimizations in cold paths do not justify obscuring code.

## Reference routing

| Need | Read |
| --- | --- |
| Practical checklist for a code-quality pass | [review-checklist.md](references/review-checklist.md) |
| Abstraction and pattern decision rules | [abstraction-rules.md](references/abstraction-rules.md) |
| Testing taste and mock boundaries | [testing-taste.md](references/testing-taste.md) |
| Error handling, state, and performance checks | [reliability-and-efficiency.md](references/reliability-and-efficiency.md) |

## Output expectations

When reviewing, report only findings with concrete maintenance, correctness, contract, test, or runtime cost. Include:

- file and line or symbol;
- what breaks or becomes harder;
- the smaller or safer change;
- verification needed after the change.

Suppress pure taste preferences that cannot name a real cost.
