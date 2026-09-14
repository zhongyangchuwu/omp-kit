# Task Subagent Test Handoff

Load this reference when delegating test authoring to a generic `task` subagent.

## When to delegate

Use a task subagent with a test-authoring role for non-trivial test work:

- new behavior needs durable tests;
- a bug fix needs a regression test;
- coverage boundaries or mock placement are non-obvious;
- multiple files or fixtures are involved;
- existing tests are brittle and need reshaping around behavior.

For trivial changes, direct verification may be enough when no meaningful test can be added without asserting plumbing.

## Handoff content

A good task assignment includes:

- target files and test files to inspect or edit;
- behavior contract to protect;
- observed bug or risk, if any;
- non-goals and behaviors not to freeze;
- preferred boundary, if known;
- external systems that must be mocked or avoided;
- command for the narrow test run, if known;
- acceptance criteria in observable terms.

Do not ask the subagent to run formatters, project-wide linters, or full test suites. Run broad verification once after integration.

## Assignment shape

Use this structure:

```text
# Target
Exact source and test files; explicit non-goals.

# Change
Behavior to protect, edge cases, expected mock boundaries, and whether red/green evidence is expected.

# Acceptance
The test fails for the old bug when practical, passes after the implementation, and is exercised by the narrow command.
```

## Review returned tests

After the subagent returns, check:

- tests assert behavior rather than implementation plumbing;
- fake data matches consumed real shapes;
- mocks are at external or nondeterministic boundaries;
- production code was not reshaped solely for tests;
- the narrow command actually exercised the new or modified tests.

Subagent output is evidence, not a substitute for inspecting the final diff and running the relevant command in the parent session.
