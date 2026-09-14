# Test Design

Load this reference when choosing what tests to add, modify, or review.

## Behavior first

A test should fail when externally meaningful behavior breaks:

- public API semantics;
- CLI behavior and exit/status contracts;
- component behavior users or callers observe;
- persisted data shape, migrations, or schema transforms;
- important side effects such as writes, cleanup, emitted events, or state transitions;
- domain invariants that must survive refactors.

Avoid tests that fail only because a private helper was renamed, a call was inlined, or incidental implementation order changed.

## Boundary choice

Prefer the highest boundary that proves the behavior without making the test slow or flaky:

1. CLI or user-facing workflow when command behavior is the contract.
2. Public API, component, or service boundary when callers depend on it.
3. Persisted data or migration boundary when data compatibility is the contract.
4. Internal function only when the unit is stable, complex, risky, or the smallest useful regression reproduction.

White-box tests are justified for:

- parsers, serializers, and schema transforms;
- migrations and data repair;
- security-sensitive validation or normalization;
- tricky state machines;
- performance-critical algorithms with clear invariants;
- regressions whose smallest meaningful reproduction is internal.

## Coverage shape

Cover a small set of cases that would catch real regressions:

- normal representative input;
- empty collection or missing optional field when valid;
- one item;
- two items when pairwise logic exists;
- exact boundary such as page size, retry count, timeout, or max length;
- one past the boundary;
- duplicate input;
- malformed but plausible external data;
- cleanup or rollback after failure.

Prefer a few strong invariant assertions over broad snapshots or exhaustive plumbing checks.

## Assertions

Prefer assertions like:

- invalid input is rejected with the stable error type, code, or state;
- pagination returns every item exactly once, including exact page-size totals;
- cancellation prevents stale state from overwriting fresh state;
- duplicate operation is idempotent;
- partial failure leaves related fields unchanged or rolled back;
- output contains the semantic field or record that callers consume.

Avoid assertions like:

- a private helper was called;
- a mock rendered when rendering is not the behavior;
- exact incidental wording;
- current default config values unless default selection is the behavior;
- broad snapshots when one semantic state matters.

## Existing tests and refactors

For pure refactors, existing tests are sufficient only when they already cover the behavior being preserved. Add characterization tests first when behavior is under-specified, high-risk, or relied on by callers. Do not freeze accidental behavior unless callers already depend on it.
