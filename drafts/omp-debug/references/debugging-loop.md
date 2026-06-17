# Debugging Loop

## Inputs

Start with:

- exact symptom and expected behavior;
- failing command, route, UI path, job, test, or integration path;
- observed error text, stack trace, logs, status, output, or artifact;
- recent changes in code, config, dependencies, data, runtime, or environment;
- what has already been tried and what each attempt proved.

## Loop

1. **Read the evidence fully** — error text, stack frames, failing assertion, logs, timestamps, paths, exit codes, and warnings.
2. **Reproduce or observe** — run the smallest path that proves the failure exists, or name the external evidence that proves it.
3. **Localize the boundary** — find which component, state transition, input, config value, dependency, or environment boundary first diverges from expectation.
4. **Compare working and broken cases** — locate a nearby working example and list concrete differences.
5. **State one hypothesis** — `I think X is the root cause because Y evidence shows Z`.
6. **Run one discriminating check** — change or inspect exactly one variable so the result confirms or rejects the hypothesis.
7. **Fix at the source** — make the smallest change that prevents the root cause.
8. **Verify the original path** — re-run the failing path, then add or update durable regression evidence when behavior changed.

## Emergency mitigation

A mitigation may be necessary when impact is active and root-cause work would extend damage. Label it explicitly:

- mitigation: what temporary action reduces impact;
- unresolved root cause: what remains unknown;
- evidence preserved: logs, inputs, config, data, and timestamps needed for follow-up;
- cleanup condition: what proves the mitigation can be removed.

Do not call a mitigation the fix unless it removes the root cause.

## Stop signals

Stop adding fixes and return to evidence when:

- the same symptom remains after a fix;
- each fix reveals a new unrelated failure;
- the hypothesis explains only part of the evidence;
- the fix requires broad refactoring before the cause is understood;
- you cannot explain why the change should affect the failing path.
