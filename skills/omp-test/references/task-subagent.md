# Task Subagent Test Handoff

Load this reference when Main has chosen to delegate test authoring to an available `task` worker. It is not a requirement to delegate every non-trivial test.

## When to delegate

Delegation can be useful when independent coverage judgment or an isolated parallel scope outweighs briefing and integration cost:

- new behavior needs durable tests;
- a bug fix needs a regression test;
- coverage boundaries or mock placement are non-obvious;
- multiple files or fixtures form a separable workstream;
- existing tests need reshaping around behavior.

These are candidates, not an automatic routing rule. Main-direct authoring remains valid. A worker with `spawns: []` writes its assigned tests or returns a blocker; it does not create another worker.

## Handoff content

A useful assignment includes:

- target files and test files to inspect or edit;
- behavior contract to protect;
- observed bug or risk;
- non-goals and behavior not to freeze;
- preferred execution boundary;
- external systems to mock or avoid;
- narrow test command when known;
- observable acceptance criteria.

Prefer focused checks during authoring. Do not request a repository-wide full suite merely because the worker is handing off; use the normal current-candidate CI gate. A distinct cross-slice diagnosis or explicitly assigned isolated verification can justify broader worker checks.

## Assignment shape

```text
# Target
Exact source and test files; explicit non-goals.

# Change
Behavior to protect, edge cases, expected mock boundaries, and whether red/green evidence is expected.

# Acceptance
The test fails for the old bug when practical, passes after implementation, and is exercised by the narrow command.
```

## Review returned tests

Check that tests assert meaningful behavior, fake data matches real consumed shapes, mocks stop at suitable boundaries, production APIs were not widened for tests, and the reported command actually exercised the change.

Inspect the integrated diff and evidence. Reuse a valid result for the relevant tree; rerun when the tree/question changed or coverage is missing, not automatically in the parent session.
