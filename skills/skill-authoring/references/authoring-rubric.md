# Authoring Rubric

Use this rubric when creating, updating, reviewing, or refactoring a skill.

## Boundary

A skill is worth creating or updating when it captures reusable judgment, workflow, domain knowledge, or deterministic tools that an agent would otherwise rediscover or get wrong.

Do not create a skill for:

- a one-off task;
- generic advice the agent already knows;
- project rules that belong in a project context file;
- purely mechanical checks that should be automated instead.

## Source grounding

Before writing, inspect source material:

- existing `SKILL.md` and support files;
- user-provided notes;
- project docs and runbooks;
- real task transcripts or corrections;
- examples of good and bad outputs;
- failure reports and maintenance history.

If source material is thin, write a narrower skill. Do not fill gaps with generic best practices.

## Required questions

A ready skill answers:

- What task does it solve?
- When should it trigger?
- When should it not trigger?
- What inputs does it expect?
- What output should it produce?
- What mistakes are likely without the skill?
- Which details must be in `SKILL.md` and which can be deferred to references?
- Does it need templates, evals, or scripts?
- What validation proves the authored skill is structurally sound?

## Structure decision

| Situation | Structure |
| --- | --- |
| Short stable workflow | One `SKILL.md` |
| Main workflow plus long background | `SKILL.md` + focused `references/` |
| Reusable output formats | Add `assets/` templates |
| Repeated deterministic processing | Add `scripts/` after defining script interface and tests |
| Important or fragile behavior | Add `evals/` and maintenance notes |

## Quality checklist

- The skill name is concrete and searchable.
- The description states what the skill does and when to use it.
- The main file is short enough to load every time the skill activates.
- References are linked only where needed.
- Examples are realistic and safe to copy.
- Gotchas describe non-obvious mistakes.
- Scripts are non-interactive and have safe defaults.
- Evals cover realistic prompts and near misses.
- Maintenance notes record status, source, risk, and review history.
- Portable guidance is separated from runtime-specific notes.

## Updating existing skills

When improving a skill:

1. Read the current skill and support files.
2. Identify the exact failure, friction, stale information, or missing trigger.
3. Preserve working behavior unless the user wants a clean redesign.
4. Add or update eval cases before changing behavior when practical.
5. Keep changes minimal and focused.
6. Re-run validation and relevant evals.
7. Update maintenance notes with what changed and why.

## Review result format

When reviewing a skill, report:

```markdown
## Verdict
ready / needs changes / unsafe to install

## Structural issues
- ...

## Triggering issues
- ...

## Portability issues
- ...

## Safety issues
- ...

## Recommended changes
1. ...
```
