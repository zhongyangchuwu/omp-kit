# Interaction and States

Use this when a feature involves a UI flow, command, action, generated result, destructive operation, permission boundary, or recoverable failure.

## Action definition

For each action in scope, define:

- **Object:** what the action affects.
- **Scope:** one item, selected items, current view, current project, account, workspace, or all data.
- **Consequence:** what changes and who can observe it.
- **Reversibility:** undo, restore, edit, retry, or irreversible.
- **Permission:** who can perform it and what blocked users see.
- **Feedback:** what the user sees immediately and when complete.

Avoid vague action names such as Confirm, OK, Submit, or Continue when consequence matters. Prefer verb + object when action changes or destroys data.

## State matrix

Cover states that are reachable from the product behavior, not just states easy to implement.

| State | Product question |
| --- | --- |
| Default | What is ready, selected, prefilled, or empty before action? |
| Loading / pending | What progress or lockout does the user see? Can they cancel? |
| Empty | What object is missing and what first action is available? |
| Success | What changed, where is the result, and what next action is natural? |
| Error | What failed, what was preserved, and how can the user recover? |
| Permission denied | What capability is unavailable and who can resolve it? |
| Offline / timeout | Can the user retry, save locally, or continue later? |
| Partial success | Which items succeeded, which failed, and what can be retried? |
| Destructive | What will be lost, is undo possible, and is friction proportional? |
| Extreme data | What happens with long names, many items, duplicate names, or no matches? |

## User habit fit

Prefer interactions users already understand:

- inline edits before modal flows when the task is local and reversible;
- explicit review before broad or destructive changes;
- preview before export, publish, or AI-generated replacement when output quality matters;
- preserving user input on failure;
- retry and edit loops for generated or network-dependent results.

Diverge from existing habits only when the feature's value requires it; name the reason.

## Output

```markdown
## Interaction decision
- Object:
- Scope:
- Consequence:
- Reversibility:
- Permission:
- Feedback:

## Required states
- Default:
- Loading:
- Empty:
- Success:
- Error:
- Permission denied:
- Offline / timeout:
- Destructive / undo:
```
