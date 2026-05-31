---
name: omp-superpowers
description: Use for non-trivial software work that benefits from structured methodology: feature design, implementation planning, debugging, TDD, verification, code review, or skill/workflow authoring. Includes a fast path for simple, low-risk tasks so routine edits are not forced through the full Superpowers lifecycle.
---

# Superpowers for Oh My Pi

This is the local Oh My Pi entrypoint for the Superpowers skill collection. Use it as lightweight process guidance by default for non-trivial software work, but do not force the full methodology onto simple tasks.


## Intent gate before action

Before editing, running mutating commands, creating files, deleting files, or dispatching implementation work, classify the user's intent:

- Discussion mode: the user is exploring an idea, asking whether something is reasonable, asking for critique, asking "what do you think", or explicitly says not to act yet. Do not mutate repository files. Respond with analysis, risks, alternatives, and recommended next steps.
- Planning mode: the user asks for a plan, design, checklist, migration path, or phased approach. Do not mutate repository files unless they explicitly ask to create or update a plan artifact. Produce the plan and wait for execution approval.
- Execution mode: the user explicitly asks to implement, edit, create, delete, refactor, migrate, update files, or execute an approved plan. Proceed with normal Oh My Pi tools after scoping and safety checks.

If intent is ambiguous, default to discussion/planning, not editing. Phrases like "先不动手", "规划一下", "讨论一下", "你怎么看", "是否合理", "what do you think", "plan", or "evaluate" are not execution approval. Phrases like "直接改", "开始做", "实现", "删除", "更新文件", "create", "implement", "apply", or "execute the plan" indicate execution mode.

## User proposal review

Treat user proposals as hypotheses to evaluate, not conclusions to blindly implement, unless the user has explicitly approved execution after tradeoffs are clear.

Before endorsing or executing a proposed approach, check whether it:

- solves the stated problem directly or substitutes a different problem;
- introduces unnecessary process, abstractions, tooling, tests, or long-term maintenance burden;
- weakens public contracts, safety, verification, reversibility, or source provenance;
- conflicts with current project stage, existing architecture, or repository conventions;
- has a smaller, clearer, or more reversible alternative.

If the proposal is flawed, say so once and concretely: what breaks, why it matters, and what to do instead. If the user still chooses the approach after that review, follow their decision unless it violates safety, repository constraints, or explicit system/developer instructions.

## Project stage policy

Before deciding process weight, infer the current project stage from repo context and the user's stated goal:

| Stage | Bias | Testing and verification |
| --- | --- | --- |
| `exploration` | Learn quickly, validate feasibility, keep throwaway code cheap. | Smoke checks and contract probes only. |
| `mvp` | Move fast, keep architecture clear, refactor aggressively when it reduces future friction. | Black-box contract tests for exposed behavior and critical paths; avoid exhaustive internal coverage. |
| `productizing` | Stabilize contracts, migration paths, operational behavior, and user-facing reliability. | Contract, edge/error, and targeted regression tests. |
| `maintenance` | Preserve compatibility and minimize unrelated churn. | Regression and contract tests around changed behavior. |
| `critical` | Prioritize correctness, auditability, safety, and reversibility over speed. | Broader verification, explicit rollback/migration checks, and stronger review gates. |

Default this personal repository to `mvp` unless evidence says otherwise. Escalate rigor automatically for data loss, migrations, auth/security, billing/cloud/SSH/secrets, public APIs, concurrency/consistency, irreversible actions, deployment, or multi-user impact.

Do not let process or test volume outrun the stage. In `exploration` and `mvp`, favor rapid iteration, clear architecture, reversible changes, and contract-level tests over exhaustive white-box coverage. In `critical` work, do not use MVP speed as an excuse to weaken verification.
## Fast path first

Before loading upstream workflow files, classify the task:

- Fast path: simple, low-risk, well-bounded tasks where the correct action is obvious and no durable plan/spec/review loop is needed. Examples: answer a narrow question, make a small text/metadata edit, run a requested validation command, fix an obvious typo, or inspect one known file. Proceed directly using normal Oh My Pi tools; keep verification proportional.
- Full workflow: ambiguous requirements, multi-file implementation, debugging without known cause, behavior changes, tests or safety implications, refactors, skill authoring, code review, or tasks likely to benefit from planning/subagents/TDD. Load `references/omp-localization.md`, then read only the specific workflow files needed.

If the task starts simple but evidence shows broader risk or uncertainty, switch from fast path to the relevant full workflow.

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

- Default behavior: use this skill for non-trivial software work, then choose fast path or full workflow.
- Use the fast path when the task is simple enough that full Superpowers process would add ceremony without reducing risk.
- Use the full workflow when the user explicitly asks for Superpowers, asks to localize/modify this collection, names a Superpowers workflow, or the task has meaningful uncertainty, risk, or scope.
- When using full workflow, read `references/omp-localization.md` first, then read only the specific upstream skill files needed.
- Upstream instructions that say to activate before every conversation, before any response, or before any creative work are not active policy here.

## Workflow routing

Use these reference files when full workflow is warranted:

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
