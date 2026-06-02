# Testing Taste

Load this reference when adding or reviewing tests as part of implementation, refactoring, or bug fixing.

## Test behavior, not plumbing

A test should fail when user-visible behavior, API semantics, data invariants, or important side effects break. It should not fail because an internal helper was renamed, a call was inlined, or a mock component changed shape without behavior changing.

Default to black-box contract tests: exercise the public API, CLI, component behavior, persisted data contract, or user-observable workflow. White-box tests are lower priority unless the internal unit is itself stable or unusually risky.

## Project-stage bias

For MVP-stage personal projects, tests should protect iteration speed as well as correctness:

- cover exposed contracts, critical paths, and bug regressions;
- skip exhaustive internal coverage when the behavior is already covered through a public boundary;
- prefer a small number of strong invariants over broad fragile assertions;
- add rigor when code touches data loss, security, money/cloud resources, public APIs, concurrency, migrations, deployment, or irreversible actions.

Do not use low test volume as an excuse to skip verification entirely. Run the narrow check that proves the exposed behavior still works.

## White-box exceptions

White-box tests are justified when the internal unit has a stable contract or concentrated risk:

- complex pure algorithms;
- parsers, serializers, or schema transforms;
- migrations and data repair functions;
- security-sensitive normalization or validation;
- tricky state machines;
- performance-critical functions with known invariants;
- a regression whose smallest useful reproduction is internal.

## Mock boundary rules

Use real code by default. Mock only:

- network, disk, time, randomness, paid/cloud services, OS resources, or slow external systems;
- nondeterministic infrastructure;
- a lower-level boundary whose behavior is already separately tested.

Do not mock:

- the component/function/class whose behavior the test is supposed to prove;
- high-level methods whose side effects are required by the behavior under test;
- local domain logic just to make setup easier.

Before mocking, answer:

1. What side effects does the real method have?
2. Does this test depend on any of those side effects?
3. What is the lowest boundary that removes nondeterminism while preserving behavior?
4. Does the fake data match the real shape consumed downstream?

## Production code must not serve tests only

Do not add production methods, exports, options, reset hooks, or bypass flags solely for tests. Put test cleanup and construction helpers in test utilities unless the API is genuinely needed by production behavior.

Bad smell:

```text
Session.destroy() exists only so tests can clean workspaces.
```

Better:

```text
test-utils cleanup owns test workspace deletion; production Session remains shaped by production lifecycle.
```

## Assert invariants

Prefer assertions like:

- invalid input is rejected with the stable error type/code;
- retry stops after the configured last attempt and preserves the final error;
- pagination returns every item exactly once, including exact page-size totals;
- cancellation prevents stale state from overwriting fresh state;
- duplicate operation is idempotent;
- partial failure leaves related fields unchanged or rolled back.

Avoid assertions like:

- a private helper was called;
- a mock element exists;
- the exact wording of an incidental message;
- snapshotting a broad tree when only one semantic state matters;
- current default config values unless the behavior is the default selection logic.

## Edge values to consider

- empty collection;
- one item;
- two items when pairwise logic exists;
- exact boundary: page size, retry count, timeout, max length;
- one past boundary;
- missing optional field that can really be absent;
- duplicate input;
- concurrent duplicate requests;
- external dependency returns malformed but plausible data;
- cleanup after failure.

## Red/green discipline

For behavior changes and bug fixes, watch the new test fail for the expected reason before changing production code. If it passes before the fix, it is not proving the missing behavior. If it errors because setup is broken, fix the setup until it fails correctly.

## Refactor tests

For pure refactors, existing tests may be enough if they cover the behavior being preserved. Add characterization tests first when behavior is under-specified or risky. Do not freeze accidental behavior unless the caller depends on it.
