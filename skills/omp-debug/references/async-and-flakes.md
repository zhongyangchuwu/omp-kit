# Async and Flakes

## Principle

Wait for the condition that proves readiness or completion. Do not guess with arbitrary sleeps.

## Use condition-based waiting when

- a test passes locally but fails in CI or parallel runs;
- the failure involves events, queues, watchers, files, jobs, browsers, workers, timers, or network callbacks;
- state is eventually consistent;
- a command times out without proving which condition failed;
- order-dependent tests leave shared state behind.

## Waiting checklist

A robust wait has:

- a named condition tied to the behavior under test;
- fresh state read inside the polling loop;
- a bounded timeout;
- an error that names the condition and last observed state;
- cleanup for processes, watchers, handles, files, or external state.

## Acceptable sleeps

A fixed delay is acceptable only when timing is the behavior being tested, such as debounce, throttle, retry backoff, rate limit windows, or tick intervals. In that case:

1. First wait for the triggering condition.
2. Use a delay derived from the documented interval or configured value.
3. State why the delay is necessary.
4. Keep the margin minimal and deterministic.

## Flake diagnosis

For flaky behavior:

1. Run the smallest failing path repeatedly enough to observe the pattern.
2. Record pass/fail conditions: order, seed, parallelism, time, environment, process reuse, cache, and input.
3. Disable or isolate one source of nondeterminism at a time.
4. Trace shared state and cleanup boundaries.
5. Fix the lifecycle or synchronization source; do not widen timeouts as the final fix unless the configured timeout was truly too low.

## Hangs and long-running processes

When debugging a hang, identify:

- the awaited condition;
- which task owns the long-lived process;
- readiness signal and health check;
- last observed log or state transition;
- open handles, locks, sockets, watchers, child processes, or browser pages;
- cleanup path after failure.

A timeout alone explains when debugging stopped; it does not explain why the system hung.
