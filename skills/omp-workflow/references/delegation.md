# Delegation Policy

## Goal

Delegate token-heavy execution without duplicating work or turning the director into another implementation worker.

## Director responsibilities

The director owns:

- interpretation of user intent;
- decomposition into independent workstreams;
- cross-workstream interfaces and invariants;
- acceptance criteria when they matter;
- escalation and integration decisions;
- deciding when user clarification is required.

Workers own scoped repository exploration, implementation, local debugging, and targeted verification for their workstream.

Verification by the director is not a license to repeat the worker's entire investigation. Inspect the minimum critical interfaces, diff, and evidence needed to judge the result.

## Initial worker selection

Choose one initial worker tier per workstream.

Use a routine worker when:

- the objective is well specified;
- implementation follows established patterns;
- failures are easy to detect;
- the work is primarily local or mechanical.

Use a deeper worker directly when:

- substantial cross-file reasoning is required;
- difficult debugging is expected;
- correctness depends on non-local invariants;
- the solution space is materially ambiguous but still technically resolvable;
- a failed cheap attempt would cost more than starting with the stronger worker.

Do not routinely run two workers on the same problem merely for supervision or confidence.

## Persistence and reuse

Treat one persistent worker as the owner of one coherent workstream. Reuse that worker for follow-up implementation or repair while its context remains relevant. Avoid spawning a replacement worker that must rediscover the same repository state unless escalation or isolation provides a concrete benefit.

## Repair and escalation

Ordinary verification failures remain with the worker under the bounded-executor repair budget.

When the same blocker survives two materially different repair attempts, the worker should stop and return evidence. The director then chooses among:

- refining the specification;
- splitting the workstream;
- escalating to a stronger worker/model;
- performing a focused architectural decision;
- asking the user when the unresolved choice is genuinely theirs.

A retry is not the same as an escalation. Track repeated repair, model escalation, and user-requested scope changes separately when evaluating the harness.

## Concurrency

Parallelism is useful only for genuinely independent workstreams. Prefer one worker per independent stream. Avoid concurrency that creates overlapping writes, duplicated exploration, or repeated review of the same code.

## Human decision boundary

Return the decision to the user when it:

- changes externally visible behavior without a clear requirement;
- commits to an expensive-to-reverse architecture;
- represents materially different UX or product tradeoffs;
- risks destructive or irreversible data changes;
- depends primarily on preference rather than technical correctness.

Do not ask the user for routine implementation details that can safely be inferred from repository conventions.
