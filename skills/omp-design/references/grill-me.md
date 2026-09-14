# Grill-me Protocol

Use this when the user explicitly asks to be grilled, pressure-test a proposed direction, defend tradeoffs, or challenge the assumptions before formal planning.

The goal is decision clarity, not adversarial debate. Challenge assumptions, consequences, and evidence—not the user.

## Protocol

1. State the direction under test and the decision it must resolve.
2. Record a compact working ledger: user/job, desired outcome, proposed direction, load-bearing assumptions, constraints, and decision deadline if one exists.
3. Select the one unanswered question most likely to change the direction. Prefer questions about user value, scope, primary tradeoff, risk, or evidence.
4. Ask that one question. Explain why it matters, provide a recommended default when appropriate, and state the tradeoff it exposes.
5. Update the ledger after the answer: accepted decisions, challenged assumptions, rejected alternatives, evidence needs, and blockers. Follow the answer rather than a fixed script.
6. Use three to seven substantive questions by default. Before extending past that range, ask whether further pressure-testing is useful. Stop early when readiness is reached.
7. Converge on one approved direction or explicitly record that the direction is not approved. Never silently resolve a material disagreement.

## Rules

- Ask one decision question at a time; do not send a questionnaire or an option dump.
- Challenge only claims whose answer can materially alter value, scope, feasibility, risk, or the success signal.
- Treat unknown facts as evidence needs. Do not invent an answer to force convergence.
- A recommendation is advice until the user explicitly accepts it.
- Do not turn an unapproved idea into a requirement, capability promise, acceptance criterion, implementation task, or planning artifact.
- Preserve a concise record, not a transcript, unless the user requests the transcript.

## Readiness test

The outcome is ready for subsequent planning only when all of these are true:

- a specific user/job and desired outcome are named;
- one direction is explicitly accepted, or a deliberate no-go is recorded;
- the primary tradeoff is accepted;
- scope and non-goals are bounded;
- success has an observable signal;
- remaining assumptions are non-blocking or have a named evidence need; and
- the user explicitly approves proceeding.

If the question budget ends without readiness, report `Ready: no` and name the blocker. Stop immediately when the user asks to stop or to proceed.

## Outcome

```markdown
## Grill-me outcome
- Decision under test:
- User / job:
- Desired outcome:
- Approved direction: <direction | no-go | not approved>
- Core tradeoff:
- In scope:
- Not doing:

## Decisions and rejected alternatives
- Accepted:
- Rejected: <option> — <reason>

## Assumptions and evidence needs
- <assumption> — <validation signal or blocker>

## Open blockers
- <blocker>

## Readiness
- Ready: <yes | no>
- Reason:
```

## Do not use this protocol for

- open-ended ideation without a decision to pressure-test;
- drafting a feature brief, PRD, state matrix, acceptance criteria, or implementation plan;
- researching facts or validating a hypothesis;
- coordination, execution, review, verification, release, or capture work.
