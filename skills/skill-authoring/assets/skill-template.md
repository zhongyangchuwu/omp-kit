---
name: skill-name
description: Describe what this skill does and when to use it. Include concrete task triggers and keep this under 1024 characters.
---

# Skill Title

## Overview

State the core purpose in one or two sentences. Explain what the agent should do differently when this skill is active.

## When to Use

Use this skill when:

- the user asks to ...;
- the task involves ...;
- the agent needs ... .

Do not use this skill when:

- the task is ...;
- another skill owns ... .

## Workflow

1. Read the relevant inputs.
2. Identify constraints and success criteria.
3. Follow the task-specific procedure.
4. Validate the result before completion.

## References

| Need | Read |
| --- | --- |
| Detailed guidance | `references/example.md` |
| Output template | `assets/example-template.md` |

## Validation

Before completion, verify:

- the requested output exists;
- edge cases were considered;
- no secrets or private paths were exposed;
- links and referenced files exist.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Over-broad trigger | Narrow the description and add negative examples |
| Long encyclopedic body | Move details to `references/` |
| Deterministic repeated work in prose | Consider a tested `scripts/` helper |
