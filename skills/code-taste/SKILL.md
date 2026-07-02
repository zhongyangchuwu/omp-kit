---
name: code-taste
description: Use when applying practical code-quality judgment for implementation, refactoring, simplification, API shape, error handling, state transitions, maintainability, performance discipline, or review findings.
---

# Code Taste

## Focus

Practical judgment for code that stays boring, explicit, efficient, and easy to change. This skill owns implementation quality, local design pressure, error/state correctness, and review findings with concrete maintenance or runtime cost.

## Activation

Use this skill for implementation choices, refactors, simplification passes, exported API or type changes, error-handling decisions, state transitions, performance-sensitive paths, and code review.

## Workflow

1. State the behavior the code must provide now.
2. Inspect nearby conventions before adding names, files, helpers, or patterns.
3. Trace representative and boundary inputs through branches, state changes, errors, and side effects.
4. Simplify by deleting concepts, collapsing branches, and reusing established helpers.
5. Preserve public contracts unless the caller accepted a breaking change.
6. Check changed tests only for production-code smells such as test-only APIs, widened contracts, or hidden behavior changes.
7. Check repeated work, allocation, I/O, unbounded loading, blocking paths, and lifecycle leaks.

## Rules

- Add an abstraction when it reduces the number of concepts a maintainer must hold today.
- Keep one canonical command, function, or API path for one purpose.
- Public inputs, outputs, persisted data, events, CLIs, and config shapes are contracts.
- Catch errors where the code can add context, recover, translate to a stable contract, or clean up.
- State transitions update related fields together or fail without partial commits.
- Production APIs should not be widened solely to make tests easier.
- Efficiency concerns name a real repeated cost, hot path, unbounded input, blocking operation, or leaked lifecycle.

## Support files

| Need | Load |
| --- | --- |
| Practical checklist for a code-quality pass | `references/review-checklist.md` |
| Abstraction and pattern decision rules | `references/abstraction-rules.md` |
| Error handling, state, and performance checks | `references/reliability-and-efficiency.md` |

## Output

Review findings name the file and line or symbol, the concrete cost, the smaller or safer change, and the verification needed. Pure preferences stay out of the report.
