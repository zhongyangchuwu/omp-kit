---
name: omp-superpowers
description: Use when the user explicitly asks to use the local Oh My Pi Superpowers workflow collection, localize Superpowers workflows, or follow the Superpowers software-development methodology.
---

# Superpowers for Oh My Pi

This is the local Oh My Pi entrypoint for the Superpowers skill collection. Superpowers is explicit-only in this repository: do not activate it merely because a task involves coding, debugging, planning, review, TDD, or skill authoring. Use it only when the user explicitly asks for Superpowers or asks to work on this Superpowers collection.

## What is included

The original Superpowers skills are stored as reviewed reference material under `references/skills/`:

- `brainstorming` — collaborative design/spec workflow before implementation.
- `using-git-worktrees` — isolated workspace setup and baseline verification.
- `writing-plans` — detailed task-by-task implementation plans.
- `subagent-driven-development` — same-session implementation via subagents and review gates.
- `executing-plans` — inline plan execution fallback.
- `test-driven-development` — RED-GREEN-REFACTOR discipline.
- `systematic-debugging` — root-cause-first debugging.
- `verification-before-completion` — fresh evidence before completion claims.
- `requesting-code-review` and `receiving-code-review` — review dispatch and feedback handling.
- `dispatching-parallel-agents` — parallel investigation for independent work.
- `finishing-a-development-branch` — merge/PR/keep/discard completion menu.
- `writing-skills` — skill authoring with process-documentation TDD.
- `using-superpowers` — upstream bootstrap rules, kept as reference only.

## Oh My Pi activation policy

- Default behavior: do not use Superpowers.
- Use Superpowers when the user explicitly says to use Superpowers, asks about Superpowers, asks to localize/modify this collection, or asks to follow a Superpowers workflow by name.
- When active, read `references/omp-localization.md` first, then read only the specific upstream skill files needed for the requested workflow.
- Upstream instructions that say to activate before every conversation or before any creative work are not active policy here.

## Workflow routing

Use these reference files when explicitly requested:

| Request | Read |
| --- | --- |
| Use the full Superpowers development lifecycle | `references/skills/using-superpowers/SKILL.md`, then `references/omp-localization.md` |
| Design/spec a feature using Superpowers | `references/skills/brainstorming/SKILL.md` |
| Create a Superpowers implementation plan | `references/skills/writing-plans/SKILL.md` |
| Execute a Superpowers plan with subagents | `references/skills/subagent-driven-development/SKILL.md` |
| Execute a plan inline | `references/skills/executing-plans/SKILL.md` |
| Apply Superpowers TDD | `references/skills/test-driven-development/SKILL.md` |
| Debug with Superpowers | `references/skills/systematic-debugging/SKILL.md` |
| Verify completion under Superpowers | `references/skills/verification-before-completion/SKILL.md` |
| Work on skills using Superpowers methodology | `references/skills/writing-skills/SKILL.md` |

## Local constraints

Follow Oh My Pi tool rules over upstream Claude/Codex/Gemini examples. In particular, prefer `read`, `find`, `search`, `edit`, `write`, `task`, `todo_write`, `github`, and `recipe` over shell equivalents. Do not copy upstream shell snippets blindly.
