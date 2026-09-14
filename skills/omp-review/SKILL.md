---
name: omp-review
description: Use when reviewing implemented or planned code for correctness, spec compliance, maintainability, security, performance, API risks, or merge readiness; produces prioritized findings with concrete fixes.
---

# OMP Review

## Focus

OMP Review owns structured quality review for software changes. It checks whether an implementation or plan satisfies its intent, preserves maintainability, manages risk, and is ready for verification or shipping.

## Activation

Use this skill for code/plan review, PR readiness, spec compliance, risk assessment, or reviewing repairs after failed verification. Use a durable review record when the project requests one; ordinary reviews can live in the response or owning PR.

## Workflow

1. Identify the review scope, intended behavior, and accepted constraints.
2. Inspect the relevant change, plan, or artifacts.
3. Select review lenses that match the risk profile.
4. Record findings with severity, location, cost, fix, and verification needed.
5. Distinguish must-fix issues from accepted risks and optional improvements.
6. Report whether the reviewed work is ready for verification, revision, or escalation.

## Rules

- Review judges quality, correctness, and risk; verification proves exercised properties.
- Findings must name a concrete problem and concrete cost.
- Required fixes must be tied to scope, safety, correctness, maintainability, or contract risk.
- Optional improvements must stay optional.
- Waived risks must record the reason and owner of the decision.
- Do not expand scope or dispatch fixes; return new scope decisions to Main.
- Keep repeated quality criteria in the owning review lens.
- A review-record template is useful structure, not a mandatory new file after every review.

## Support files

| Need | Load |
| --- | --- |
| Finding format and severity | `references/findings.md` |
| Review lenses | `references/lenses.md` |
| Spec compliance review | `references/spec-compliance.md` |
| Optional durable review record shape | `references/review-record.md` |
