# Regression Tests

Load this reference when writing tests for a bug fix or behavior that previously failed.

## Contract

A regression test protects the behavior that was broken, not the implementation line that caused the break. It should fail if the bug returns through any plausible implementation path.

## Red/green discipline

For behavior changes and bug fixes, observe the new test fail for the expected reason before changing production code when practical.

Acceptable alternatives when red cannot be observed:

- the fix already exists in the working tree;
- the failure requires external infrastructure unavailable locally;
- the original failure was flaky and cannot be made deterministic within scope;
- reproducing the failure would require destructive or paid side effects.

When red cannot be observed, record why and make the assertion target the original failure contract as directly as possible.

## Reproduction shape

A useful regression test includes:

- the smallest setup that reproduces the broken contract;
- inputs or state matching the real trigger;
- an assertion on the externally meaningful result;
- a failure path check when the bug involved silent success, stale state, partial writes, or swallowed errors.

Avoid tests that only assert the new implementation detail, such as a helper call, branch flag, or internal ordering.

## Naming

Name the test after the behavior, not the issue tracker number alone.

Good:

```text
test_promote_skill_moves_draft_by_default
```

Weak:

```text
test_issue_1234
```

Issue numbers can appear in comments only when they add useful historical context.

## Flakes and async regressions

For races, timeouts, retries, or async behavior:

- prefer condition-based waits over arbitrary sleeps;
- force deterministic ordering with explicit synchronization when possible;
- assert final state and cleanup, not just that no exception was raised;
- keep retry counts and timeout boundaries small and controlled.
