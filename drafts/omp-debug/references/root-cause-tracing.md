# Root Cause Tracing

## Principle

The line that throws is often only where invalid data, state, or timing becomes visible. Trace backward until you find the earliest trigger that made the bad state possible.

```text
symptom -> immediate cause -> caller -> input origin -> root trigger -> source fix
```

## Process

1. **Name the symptom** — exact exception, assertion, wrong output, hang, missing file, stale state, or unexpected side effect.
2. **Find the immediate cause** — the expression, state transition, command, query, request, or render path that directly fails.
3. **Trace the caller** — what passed the bad value, omitted required state, called in the wrong order, or invoked the wrong environment.
4. **Trace the origin** — where that value or state was created, mutated, cached, defaulted, serialized, deserialized, or loaded.
5. **Find the trigger** — the first incorrect assumption, missing guard, lifecycle violation, dependency change, migration gap, or race.
6. **Fix the trigger** — prevent the bad state at the earliest source with a narrow change.

## Instrumentation

Add temporary instrumentation when static reading cannot prove the path:

- log before the dangerous operation, not only after it fails;
- include input values, normalized paths, selected config, environment identity, state version, and timestamps;
- capture stack or call path when the caller is unclear;
- include component boundary data: what entered, what exited, and what changed;
- remove temporary noise after the root cause is fixed unless it is useful durable diagnostics.

## Test pollution and order dependence

For failures caused by shared state, global files, environment variables, caches, databases, time, or process state:

1. Confirm whether the pollutant exists before the test or command starts.
2. Run the smallest test file, test case, or command group that can create it.
3. Split the group until the first polluter is known.
4. Fix fixture lifecycle, teardown, isolation, namespacing, or state reset at the source.
5. Add a regression check that would fail if pollution returns.

## Output

A good trace records:

- immediate failing operation;
- caller or boundary that introduced the bad state;
- original trigger;
- source fix;
- any defense-in-depth checks added after the source fix.
