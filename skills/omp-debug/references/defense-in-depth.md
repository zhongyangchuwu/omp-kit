# Defense in Depth

## Principle

Add guards after the root cause is known. Defense-in-depth makes the same bad state hard to reintroduce; it is not a substitute for root-cause diagnosis.

## When to add layers

Use layered checks when the bug involved:

- invalid input crossing public or internal boundaries;
- dangerous filesystem, network, process, database, billing, auth, or migration operations;
- environment-specific behavior such as tests vs production;
- mocks or alternate code paths bypassing normal validation;
- shared state that can be mutated from multiple entry points.

## Layer types

Choose only layers that catch a real bypass path:

1. **Entry boundary** — validate user, API, CLI, config, file, event, or test fixture input.
2. **Domain invariant** — assert state combinations and lifecycle transitions that must always hold.
3. **Environment guard** — prevent dangerous operations in tests, development, dry-run, or restricted runtimes.
4. **Operation guard** — check normalized path, target identity, transaction scope, idempotency key, lock, or permission before side effects.
5. **Durable diagnostics** — keep low-noise logs or errors that identify the failing boundary if a guard trips again.

## Rules

- Add the source fix first.
- Add each guard because a named path can bypass an earlier guard.
- Keep error messages specific enough to debug.
- Do not change public contracts silently.
- Do not add broad validation that rejects valid existing behavior.
- Test the guard when the risk is important enough to keep it.

## Output

Record:

- root cause fixed;
- layers added;
- bypass path each layer closes;
- regression evidence for the source fix and important guards.
