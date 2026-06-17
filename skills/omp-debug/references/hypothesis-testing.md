# Hypothesis Testing

## Rule

One hypothesis, one discriminating check, one changed variable.

## Hypothesis shape

Write the hypothesis before changing code:

```text
I think <root cause> because <observed evidence>. If true, <check> should show <expected result>.
```

Examples of useful checks:

- inspect the value at the component boundary;
- compare a working path and broken path;
- run the failing case with one config value changed;
- isolate one dependency, test file, route, or lifecycle step;
- add temporary logging around the suspected transition;
- run the same input through a smaller reproduction.

## Results

After the check:

- **Confirmed** — implement the smallest source fix and verify the original failing path.
- **Rejected** — remove temporary changes, record what was learned, form a new hypothesis.
- **Inconclusive** — improve the observation; do not patch on inconclusive evidence.

## Anti-patterns

Avoid:

- changing several suspected fixes before rerunning;
- broad refactors while the cause is unknown;
- suppressing exceptions, warnings, or failed assertions;
- adding retries, sleeps, defaults, or fallbacks without evidence they address the root cause;
- treating a passing unrelated check as proof;
- ignoring contradictory evidence because a fix seems plausible.

## Repeated failed fixes

If two or three attempted fixes fail, assume the model is wrong. Stop and re-evaluate:

- Is the failing path the one being exercised?
- Is the observed failure a symptom of a deeper lifecycle or architecture problem?
- Does a hidden cache, async race, global state, fixture, or external dependency control the result?
- Does the implementation pattern match a working example?
- Is the requirement or invariant itself wrong?

Escalate to design or review before adding another speculative patch.
