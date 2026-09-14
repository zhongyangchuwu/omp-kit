---
name: git-workflow
description: Use for Git/GitHub repository state, owning Issue/PR boundaries, safe branch/merge operations, CI/review handling, and acceptance-based Issue closure.
---

# Git Workflow

Keep Git/GitHub work state-driven and proportional. General Git syntax, branch naming and commit prose do not need a project-specific playbook; this Skill exists for omp-kit's repository governance boundaries.

## Before mutation

Read the actual branch, HEAD, worktree/dirty state and relevant PR/Issue state before acting. Preserve unrelated or pre-existing user changes. Retrieved notes/history never replace current Git/GitHub read-back.

For non-trivial work in a repository that already uses Issues, identify the owning concrete Issue when one exists. Do not create an Issue merely to satisfy process when a small PR fully owns the work.

## Change boundary

Small low-risk maintenance can use the current workspace when repository/user policy permits it. Non-trivial behavior, shared-contract, release or multi-file work normally uses a short-lived branch and PR.

Keep one PR focused on one coherent change/problem. If implementation exposes another independently closable problem, return it to Main rather than silently widening the PR.

Workers may produce local/scoped evidence, but Main owns remote repository mutation and final integration/merge judgment.

## Verification and review

Use focused checks while changing code. When repository CI owns the routine full deterministic gate, the current PR candidate's CI is the normal mechanical acceptance evidence; do not duplicate an unchanged gate locally without another reason.

Read failed job logs before changing code. Fix the actual failing layer and require evidence for the updated candidate.

Use independent review when its expected semantic/risk value justifies the cost, not as a mandatory ritual.

## Merge

Before merge, confirm the current head/base, required CI/review state, and authorization. Never infer merge permission from old discussion or a passing check.

Choose squash/merge/rebase by repository policy and whether commit/stack ancestry has durable value; no method is universally required.

After merge, inspect the landed state/CI when required and re-evaluate the owning Issue acceptance criteria.

**Merged does not mean completed.** Close an Issue only when its acceptance criteria are complete or deliberately superseded. If dogfood/runtime/upstream conditions remain, keep it open and use the repository's active/inactive semantics.

Delete an ordinary branch/worktree only after confirming its work is merged/saved and no stacked or dependent work still needs it.

## Tool boundary

Use the Git/GitHub surfaces actually available in the current runtime. Do not encode a volatile command catalogue into this Skill. Local Git state belongs to Git; hosted PR/Issue/CI state belongs to GitHub read-back.
