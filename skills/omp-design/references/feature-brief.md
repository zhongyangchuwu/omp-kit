# Feature Brief

Use this as the default artifact when a feature needs product clarity but not a full PRD.

A feature brief should be short enough for an implementer to keep in working memory and specific enough that they do not reinterpret the goal.

## Template

```markdown
# Feature Brief: <name>

## Intent
<What the user wants to accomplish and why this feature exists now.>

## User / Job
<Primary user, situation, and job-to-be-done.>

## Habit Fit
<Existing user habit, platform convention, competitor norm, or project pattern this should follow. Note intentional deviations.>

## Product Behavior
<What the feature does from the user's point of view.>

## Scope
### In
- <Required for the smallest useful version.>

### Out
- <Explicitly deferred or excluded, with reason.>

## User Flow
1. <Entry point>
2. <Action>
3. <Feedback>
4. <Completion or recovery>

## State Coverage
- Default:
- Loading:
- Empty:
- Success:
- Error:
- Permission / unavailable:
- Destructive / undo, if relevant:

## Acceptance Criteria
- [ ] <Observable behavior or output.>

## Decisions
- <Accepted decision>

## Open Questions
- <Question and blocker>

## Rejected Options
- <Rejected option> — <reason>
```

## Quality bar

The brief is ready when:

- the user/job is specific;
- scope and non-goals prevent accidental expansion;
- the core flow is complete end to end;
- the states cover likely failure and recovery paths;
- acceptance criteria are observable;
- another agent can implement without inventing product behavior.
