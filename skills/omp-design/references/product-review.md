# Product Review

Use this when reviewing an existing feature idea, brief, PRD, mockup, flow, or implementation for product correctness.

Stay at product altitude. Do not review code structure, visual polish, or test mechanics unless they change user-visible behavior.

## Severity

- **P0:** blocks the primary user task, causes unrecoverable user harm, or makes a destructive consequence unintelligible.
- **P1:** likely task failure, missing critical state, misleading action consequence, or unsafe scope ambiguity.
- **P2:** meaningful friction, weak habit fit, avoidable confusion, or incomplete recovery.
- **P3:** minor clarity, consistency, or product craft improvement.

## Review lenses

- User/job: is the feature solving a real stated or inferred job?
- Habit fit: does it follow expected user, platform, and project patterns?
- Scope: are in-scope and out-of-scope decisions explicit?
- Action consequence: does each action name what it affects and what changes?
- State coverage: are non-happy paths designed?
- Useful slice: can the first version complete a real user job end to end?
- Acceptance: can completion be observed or tested?
- Assumptions: are guesses marked and paired with validation signals?

## Finding format

```markdown
P1 — <finding title>
Location: <feature area, flow step, spec section, or UI state>
User consequence: <what breaks for the user>
Evidence: <observed text, decision, missing state, or stated assumption>
Smallest product fix: <decision or behavior change>
Acceptance check: <observable check>
```

## Anti-patterns

- Reporting implementation preferences as product findings.
- Treating visual taste as product correctness.
- Flagging a missing state without naming the user consequence.
- Suggesting broader scope when a narrower useful slice would solve the issue.
- Accepting a technically complete feature that does not complete the user's job.
