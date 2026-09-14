# Description Guide

The `description` field is the main trigger surface. It should help an agent decide whether to load the skill before reading the full `SKILL.md`.

## Good description properties

A strong description:

- says what the skill does;
- says when to use it;
- includes likely user words and task synonyms;
- is specific enough to avoid near-miss false positives;
- stays under 1024 characters;
- does not try to replace the full workflow.

## Formula

```yaml
description: Do X, Y, and Z for domain/task. Use when the user asks for A, B, C, or when symptoms D and E appear.
```

For discipline or process skills, keep process detail out of the description. Put the full workflow in the body so the agent must read it.

## Trigger examples

For each important skill, write trigger tests:

```json
[
  {
    "query": "Create a reusable skill for reviewing Terraform plans before apply.",
    "should_trigger": true
  },
  {
    "query": "Install this downloaded skill bundle into every agent directory.",
    "should_trigger": false
  }
]
```

Use about 8-10 positive and 8-10 negative prompts for important skills. Include casual phrasing, file paths, typos, near misses, and multi-step requests where the skill need is embedded.

## Should-trigger prompts

Good positives vary by:

- explicit domain naming;
- implicit user intent;
- short and long prompts;
- maintenance tasks, not just creation;
- realistic paths and examples.

Examples for this skill:

- "Turn these runbook notes into a portable Agent Skill."
- "Review this `SKILL.md`; I think it triggers too often."
- "Move long sections out of the skill body into references."
- "Add evals for this skill's expected behavior."

## Should-not-trigger prompts

Good negatives are near misses:

- "Use an existing skill to process this PDF."
- "Install a third-party skill into my agent config."
- "Write a normal README for this library."
- "Create a Python package unrelated to Agent Skills."

## Optimization loop

1. Run trigger queries against the current description.
2. Identify false negatives and false positives.
3. Revise the description for the category of failure, not one exact prompt.
4. Re-test with held-out prompts.
5. Keep the shortest description that triggers correctly.

## Common mistakes

| Mistake | Why it fails | Fix |
| --- | --- | --- |
| "Helps with skills" | Too vague | Name concrete tasks: create, review, update, eval |
| Listing only implementation details | User prompts rarely mention internals | Describe user intent |
| Too many unrelated duties | False triggers | Split into separate skills |
| Full workflow in description | Agent may skip the body | Move workflow into `SKILL.md` |
| No negative boundary | Near misses trigger | Add "when" wording that narrows scope |
