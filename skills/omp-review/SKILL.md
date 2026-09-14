---
name: omp-review
description: Use when reviewing implemented or planned code for correctness, spec compliance, maintainability, security, performance, API risks, or merge readiness; produces prioritized findings with concrete fixes.
---

# OMP Review

## Focus

OMP Review owns structured quality review for software changes. It checks whether an implementation or plan satisfies its intent, preserves maintainability, manages risk, and is ready for verification or shipping.

## Activation

Use this skill when the task involves:

- code review;
- plan review;
- merge or PR readiness;
- checking implementation against a spec, plan, or acceptance criteria;
- identifying maintainability, security, performance, API, migration, or operational risks;
- reviewing fixes after failed verification;
- producing a `REVIEW.md` record.

## Workflow

1. Identify the review scope, intended behavior, and accepted constraints.
2. Inspect the relevant change, plan, or artifacts.
3. Select review lenses that match the risk profile.
4. Record findings with severity, location, cost, fix, and verification needed.
5. Distinguish must-fix issues from accepted risks and optional improvements.
6. Confirm the reviewed work is ready for verification, revision, or escalation.

## Rules

- Review judges quality, correctness, and risk; verification proves behavior.
- Findings must name a concrete problem and concrete cost.
- Required fixes must be tied to scope, safety, correctness, maintainability, or contract risk.
- Optional improvements must stay optional.
- Waived risks must record the reason and owner of the decision.
- Do not expand scope during review; route new work to planning.
- Keep repeated quality criteria in the owning review lens.

## Support files

| Need | Load |
| --- | --- |
| Finding format and severity | `references/findings.md` |
| Review lenses | `references/lenses.md` |
| Spec compliance review | `references/spec-compliance.md` |
| Review record shape | `references/review-record.md` |
