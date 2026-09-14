# Code Taste Review Checklist

Load this reference when performing a focused implementation, refactor, or code-review pass.

## First pass: understand the change

- What behavior is supposed to change?
- What must remain compatible?
- Which files are public boundaries versus internal implementation?
- What conventions already exist near the changed code?
- Is the change solving the user's problem directly, or adding infrastructure around it?

Also identify the project stage. In `exploration` and `mvp`, bias toward fast iteration, clear architecture, and contract-level verification. Escalate rigor for data loss, security, public APIs, concurrency, deployment, or irreversible operations.

## Correctness checks

Trace concrete values instead of reading abstractly:

- empty input;
- one item;
- maximum or page-boundary input;
- null/undefined/optional values that can really occur;
- exact retry/exhaustion boundary;
- partial failure after earlier side effects;
- cancellation or stale async completion;
- concurrent writers or repeated calls.

Flag only bugs with a visible path from input to wrong result. Do not ask for defensive checks around states that cannot occur.

## Maintainability checks

Flag when the diff adds:

- a wrapper with no behavior;
- an interface with one implementation and no boundary need;
- a factory for one type;
- a manager/helper/utils name hiding unrelated behavior;
- a mode flag or boolean that multiplies branches;
- feature-specific logic in a shared module;
- a new helper duplicating a canonical existing helper;
- dead code, commented-out code, or compatibility shims for unreleased paths;
- more than two delegation hops before reaching the real logic.

Do not flag framework-required structure or domain complexity that genuinely exists.

## Contract checks

For APIs, exported types, CLIs, persisted data, events, and config files, check:

- renamed or removed fields;
- required fields made optional, or optional fields made required;
- `T` changed to `T | null` or vice versa;
- status code, error code, or error-shape changes;
- default behavior changes;
- sort order or pagination semantics changes;
- serialization format changes;
- migration/deprecation path for breaking changes.

Additive optional fields and new endpoints are usually safe. Mutating existing semantics is not.

## Simplicity checks

Ask these in order:

1. Can this be deleted?
2. Can this branch be collapsed by changing the data shape?
3. Can an existing helper or convention replace this code?
4. Can a name make this concept clear without adding a new layer?
5. Does the abstraction reduce concepts today?

Prefer obvious code over clever code. Prefer fewer concepts over fewer lines.

## Test-related production checks

Flag production-code risks exposed by tests:

- production APIs, exports, flags, or reset hooks added only for tests;
- widened input types or swallowed errors added only to make checks pass;
- mocks that hide required side effects of the code under review;
- fake objects whose shape cannot represent consumed production data.

## Efficiency checks

Flag measurable risks:

- N+1 storage/network calls on user-sized data;
- unbounded list/table reads;
- object creation, parsing, regex compilation, string building, or copying inside hot loops;
- blocking I/O on async/request/render paths;
- cache without clear invalidation or bounds;
- event listeners, timers, goroutines, tasks, subscriptions, or file handles without cleanup;
- unconditional state updates in polling or frequent event handlers.

Suppress speculative performance style opinions without expected scale or hot-path evidence.
