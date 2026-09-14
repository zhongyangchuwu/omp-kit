# Mock and Fake Boundaries

Load this reference when deciding whether to use real code, mocks, fakes, fixtures, or monkeypatching.

## Default

Use real code by default. Mock only the boundary that makes the test slow, nondeterministic, expensive, unavailable, or unsafe.

Acceptable mock or fake boundaries:

- network services;
- paid or cloud resources;
- disk paths when the behavior is not filesystem semantics;
- wall-clock time and timers;
- randomness;
- OS resources, subprocesses, terminals, SSH, browsers, GPUs, or debuggers;
- a lower-level dependency whose behavior is already separately tested.

Do not mock:

- the component, function, class, or command whose behavior the test is supposed to prove;
- high-level methods whose side effects are required by the behavior under test;
- local domain logic only to make setup easier;
- persistence or cleanup when the contract is persistence or cleanup.

## Boundary questions

Before mocking, answer:

1. What side effects does the real method have?
2. Does this test depend on any of those side effects?
3. What is the lowest boundary that removes nondeterminism while preserving behavior?
4. Does fake data match the real shape consumed downstream?
5. Will this mock keep passing if the real integration contract breaks?

If the answer to question 5 is yes, the mock is probably too high-level.

## Fake data

Fake data must be structurally honest:

- include required fields actually consumed downstream;
- preserve nullability and missing-field cases that can occur;
- use realistic IDs, paths, timestamps, and status values when code parses them;
- include malformed but plausible dependency responses for error handling tests.

Partial fake objects are acceptable only when the test boundary cannot observe omitted fields. Otherwise they hide integration breakage.

## Production code shape

Do not add production methods, exports, reset hooks, dependency injection knobs, bypass flags, or alternate constructors solely for tests. Put cleanup and construction helpers in test utilities unless the API is genuinely required by production behavior.

Test-only production seams are justified only when they expose a real production boundary that callers can also use safely.
