# PRD

Use this when the user asks for a PRD, requirements document, or implementation-facing feature specification.

A PRD documents product decisions. It is not a substitute for making those decisions.

## PRD shape

```markdown
# PRD: <feature>

## Problem
<Specific user or business problem with evidence or stated assumption.>

## Users / Personas
<Primary and secondary users. Mark inferred users as assumptions.>

## Goals
- <Observable outcome>

## Non-goals
- <Explicit exclusion and reason>

## User Stories
### US-1: <title>
As a <persona>, I want <action>, so that <benefit>.

## Functional Requirements
| ID | Requirement | Priority | Story |
| --- | --- | --- | --- |
| FR-1 | ... | Must | US-1 |

## Non-functional Requirements
| ID | Requirement | Target | Measurement |
| --- | --- | --- | --- |
| NFR-1 | ... | ... | ... |

## Interaction and State Requirements
- Default:
- Loading:
- Empty:
- Success:
- Error:
- Permission denied:
- Destructive / undo:

## Acceptance Criteria
- [ ] Given ..., when ..., then ...

## Dependencies and Risks
- ...

## Assumptions to Validate
- ... — signal

## Open Questions
- ...
```

## Rules

- Problem before solution.
- Every Must requirement maps to a user story or explicit product constraint.
- Non-functional requirements must be measurable or observable.
- Acceptance criteria describe user-observable behavior or system output.
- Mark assumptions; do not present guesses as research.
- Do not include implementation architecture unless it changes product behavior or constrains product scope.

## PRD readiness check

A PRD is ready for planning when:

- target users and the core job are clear;
- goals and non-goals prevent scope drift;
- requirements are specific enough to test;
- key states and failure paths are defined;
- open questions are either non-blocking or explicitly assigned;
- no vague terms remain without a measurement or example.
