---
name: omp-superpowers
description: Use for non-trivial software work that needs structured methodology: discussion/planning/execution intent, feature design, implementation planning, debugging, TDD cadence, verification, review orchestration, or subagent coordination. Includes a fast path for simple, low-risk tasks.
---

# Superpowers for Oh My Pi

## Focus

Structured software-work cadence for Oh My Pi. This skill decides the working mode, process weight, planning depth, subagent shape, and verification standard for non-trivial engineering tasks.

## Activation

Use this skill for work with meaningful uncertainty, risk, coordination, behavior change, debugging, TDD cadence, review, verification, or workflow design. Simple bounded edits take the fast path with proportional verification.

## Intent gate

Classify intent before mutating files, running mutating commands, creating resources, deleting resources, or dispatching implementation work:

- **Discussion**: explore an idea, critique a proposal, compare options, or answer planning questions. Produce analysis, risks, alternatives, and recommended next steps.
- **Planning**: design a solution, write a checklist, produce a migration path, or break work into phases. Produce the plan artifact or response requested by the user.
- **Execution**: implement, edit, create, delete, refactor, migrate, or execute an approved plan. Scope the change, follow repository conventions, and verify the result.

Ambiguous intent stays in discussion or planning. Explicit implementation verbs move to execution.

## Project stage

Match process weight to the project stage and blast radius:

| Stage | Bias | Verification |
| --- | --- | --- |
| `exploration` | Learn quickly and keep throwaway work cheap. | Smoke checks and contract probes. |
| `mvp` | Move fast with clear architecture and reversible changes. | Contract-level tests for exposed behavior and critical paths. |
| `productizing` | Stabilize public behavior, migration paths, and operations. | Contract, edge/error, and targeted regression tests. |
| `maintenance` | Preserve compatibility and minimize unrelated churn. | Regression and contract checks around changed behavior. |
| `critical` | Prioritize correctness, auditability, safety, and reversibility. | Broader verification, rollback/migration checks, and stronger review gates. |

Escalate rigor for data loss, migrations, auth/security, billing/cloud/SSH/secrets, public APIs, concurrency/consistency, irreversible actions, deployment, and multi-user impact.

## Workflow

1. Choose fast path or full workflow from risk, scope, ambiguity, and user intent.
2. Inspect existing context and conventions before proposing structure.
3. For design work, ask one decision at a time with concrete options and a recommended default.
4. For planning work, define dependencies, acceptance criteria, verification, and safe parallelization points.
5. For execution work, keep tasks small, coordinate subagents with lean context, and let the controller verify the final integrated state.
6. For debugging, reproduce or observe the failure, trace data/config flow, test one hypothesis, and fix the root cause.
7. For completion, provide fresh evidence that the intended behavior works.

## Rules

- User proposals are hypotheses to evaluate against the stated problem, current stage, existing architecture, safety, reversibility, and simpler alternatives.
- Full workflow loads `references/omp-localization.md` first, then the specific support file needed for the task.
- TDD cadence means: state expected behavior, observe a failing focused check, implement the smallest working change, refactor while the check remains passing, and keep durable regression coverage.
- Verification proves the intended effect. For config, provider, environment, auth, or model changes, verify the observable difference.
- Subagent assignments carry exact scope, files, constraints, and acceptance criteria. The controller runs integration verification.
- Long-lived process work defines process ownership, readiness checks, target process identity, and cleanup before trusting E2E results.

## Support files

| Need | Load |
| --- | --- |
| OMP adaptation for upstream Superpowers material | `references/omp-localization.md` |
| Full Superpowers lifecycle reference | `references/skills/using-superpowers/SKILL.md` |
| Brainstorming and design/spec workflow | `references/skills/brainstorming/SKILL.md` |
| Implementation plan writing | `references/skills/writing-plans/SKILL.md` |
| Subagent-driven execution | `references/skills/subagent-driven-development/SKILL.md` |
| Inline plan execution | `references/skills/executing-plans/SKILL.md` |
| TDD cadence | `references/skills/test-driven-development/SKILL.md` |
| Systematic debugging | `references/skills/systematic-debugging/SKILL.md` |
| Completion verification | `references/skills/verification-before-completion/SKILL.md` |
| Skill workflow authoring | `references/skills/writing-skills/SKILL.md` |

Upstream support files are reviewed reference material. OMP tool policy and local repository instructions govern execution.
