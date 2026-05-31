# Reliability and Efficiency Checks

Use this reference when code touches errors, state, concurrency, resources, I/O, or hot paths.

## Error handling

### Catch at the right level

Catch an error only to do one of these:

- add useful context;
- translate it into a stable public error contract;
- recover with a domain-correct fallback;
- clean up resources;
- retry when the operation is safe to retry.

Do not catch just to log and continue. Do not catch broad exceptions around programming bugs and return success-shaped data.

### Preserve meaning

- Empty result means “there are no results,” not “the query failed.”
- `null` means a documented absence, not “some unknown error happened.”
- A fallback value must be domain-correct and observable if it indicates degraded behavior.
- Wrapped errors should preserve original cause where the language supports it.

### Retries

Retry only when:

- the operation is idempotent or has an idempotency key;
- the failure mode is transient;
- retry count and backoff are bounded;
- final failure is returned with context;
- partial side effects cannot duplicate user-visible work.

## State transitions

For every state change, identify:

- source of truth;
- fields that must change together;
- valid states and invalid combinations;
- what happens on partial failure;
- what happens if the operation is repeated;
- whether stale async results can overwrite newer state.

Avoid boolean soup. When multiple booleans encode a state machine, use an explicit state representation if it makes invalid states unrepresentable.

## Resource lifecycle

Every acquired resource needs an owner and release path:

- files and sockets are closed;
- timers and intervals are cleared;
- event listeners and subscriptions are removed;
- goroutines/tasks/workers have cancellation or shutdown;
- temporary files/directories have cleanup ownership;
- caches have bounds or lifecycle.

Cleanup APIs belong to the owner of the resource lifecycle, not whichever test or caller finds cleanup convenient.

## Concurrency

Check for:

- read-modify-write races;
- TOCTOU existence checks;
- concurrent duplicate requests;
- shared mutable state without synchronization;
- async operations that assume completion order;
- cancellation ignored by worker loops;
- channels/queues that can block forever or leak producers.

Prefer direct operation plus error handling over pre-checks:

```text
Do: open/delete/update and handle not-found/permission/conflict.
Avoid: check exists, then operate later on stale knowledge.
```

## Efficiency

Focus on costs users or operators can feel:

- repeated storage/network calls in loops;
- unbounded loading of user/data-sized collections;
- blocking I/O on request/render/event-loop paths;
- unnecessary allocation or parsing inside hot loops;
- repeated serialization/deserialization;
- repeated regex compilation;
- broad file reads when a targeted read would suffice;
- cache invalidation ambiguity.

Do not obscure cold-path code for tiny savings. Do not add caching without a clear invalidation and bound story.

## Verification guidance

Match verification to the risk:

- behavior change: run the tests covering the changed behavior;
- contract change: run consumer or integration checks if available;
- refactor: run existing behavior tests for touched paths;
- hot path: use an existing benchmark/profile only if performance was the reason for change;
- concurrency/race risk: use race detector or deterministic interleaving test when available.

Never weaken tests, widen types, swallow errors, or add fallback behavior just to make checks pass.
