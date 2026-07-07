# Decision Interview

Use this when a feature request has user-visible ambiguity: scope, behavior, flow, consequence, user fit, or acceptance criteria are not settled.

## Interview rules

- Ask one decision question at a time.
- Include a recommended answer and the tradeoff behind it.
- Follow the thread, not a script; stop as soon as the next implementer can act without reinterpreting the feature.
- Do not ask the user to confirm facts the codebase, product artifacts, or tools can answer.
- Confirm new user-visible behavior, capability promises, destructive consequences, integrations, or scope expansion before treating them as scope.
- Record accepted decisions separately from open questions and rejected options.
- Never turn an unconfirmed idea into a task, acceptance criterion, integration, or capability promise.

## Question patterns

Use the smallest question that resolves the next product decision.

### Clarify vagueness

- "Who is the primary user for this version?"
- "When you say this should be simple, should simple mean fewer steps, fewer choices, or fewer concepts?"
- "What does good output look like from the user's point of view?"

### Make abstract concrete

- "Walk me through the moment the user reaches for this feature. What happened just before?"
- "What should the user see or receive after the action succeeds?"
- "What would make the user think the feature failed, even if the system technically worked?"

### Surface assumptions

- "Should this follow an existing product pattern, or is this intentionally a new interaction?"
- "Is the user allowed to change or undo the result?"
- "Which existing data or permission boundary should this feature respect?"

### Find edges

- "What is explicitly out of scope for this version?"
- "What input size, data type, or user role can we defer without making the feature useless?"
- "What would make this feature unsafe, misleading, or not worth shipping?"

### Define done

- "What user-observable behavior proves this is working?"
- "What is the minimum result a real user could complete end to end?"
- "Which failure path must be designed before this is safe to ship?"

## Output

When the interview resolves the current ambiguity, summarize:

```markdown
## Accepted decisions
- ...

## Rejected options
- ... — reason

## Open questions
- ... — owner / blocker

## Implementation-facing definition
- User/job:
- Product behavior:
- Scope:
- Non-goals:
- Acceptance check:
```
