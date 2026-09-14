# Useful Slice

Use this when implementation complexity pressures the agent toward a trivial or incomplete version.

A slice is useful only if a real user can complete the core job end to end. Small is good; useless is not.

## Principle

Prefer the smallest useful slice, not the smallest technical slice.

Complexity is a tradeoff, not a veto. If the full feature is too large, narrow the surface while preserving the user's core outcome.

## Good ways to narrow

Narrow in this order before cutting core value:

1. Target one primary user or role.
2. Target one high-value situation.
3. Limit input types or data range.
4. Limit output format.
5. Limit configuration and advanced controls.
6. Limit integrations.
7. Limit automation, but keep manual completion possible.
8. Stage delivery behind a clear next slice.

## Do not cut first

Avoid cutting these unless the user accepts the tradeoff:

- the user's ability to complete the core job;
- clear action consequence and feedback;
- basic error recovery;
- preserving user input after failure;
- essential permission or safety behavior;
- the output quality threshold that makes the feature worth using.

## Bad slices

- A button exists but does not produce the result users need.
- A dashboard exists but cannot answer the target question.
- A form saves data but users cannot retrieve or act on it.
- An AI action runs but users cannot preview, edit, retry, or reject bad output.
- Export exists but omits the data users actually came to export.
- A collaboration feature stores comments but does not notify or surface them where collaborators work.

## Good slices

- Export only the current filtered table to CSV, but include exactly the visible columns and preserve sort/filter context.
- Generate one draft summary for one document type, but let the user preview, edit, retry, and keep their original content.
- Support one primary role and one permission path, but make blocked users understand who can act.
- Build one complete onboarding path for one persona instead of a generic setup shell for everyone.

## Output

```markdown
## Smallest useful slice
<User can complete this end-to-end job: ...>

## Narrowing choices
- ... — why this preserves value

## Deferred
- ... — why safe to defer

## Must not cut
- ... — why it is core to usefulness
```
