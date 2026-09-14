---
name: omp-review
description: Use when reviewing implemented or planned code for correctness, spec compliance, maintainability, security, performance, API risks, or merge readiness; produces prioritized findings with concrete fixes.
---

# OMP Review

Review is a judgment layer, not another artifact lifecycle. Use it to identify concrete semantic/product risks that deterministic checks do not already decide.

## Workflow

1. Establish the review scope, intended behavior, accepted constraints and available evidence.
2. Inspect the relevant change/plan and select only the lenses that match its risk profile.
3. Compare implementation with explicit requirements and acceptance criteria when they exist.
4. Report prioritized findings with severity, location, consequence, concrete fix and verification needed.
5. Separate blockers/required fixes from accepted risks and optional improvements.
6. If no material finding remains, say so and name any residual evidence gap that still matters to acceptance.

## Rules

- Review judges correctness, maintainability, product intent and risk; deterministic verification proves the contracts it actually tests.
- A finding must identify an observed problem and concrete cost, not merely a preference.
- Required fixes must be tied to correctness, safety, scope, maintainability or a real contract risk.
- Optional improvements remain optional.
- Do not create `REVIEW.md` or another persistent review artifact by default; the owning PR/Issue already preserves review history.
- Do not expand the implementation scope during review. Return independently actionable new work to Main for an owning-Issue/scope decision.
- Prefer a mechanically clean integrated diff when available so review effort is spent on distinct failure classes.

## References

| Need | Load |
| --- | --- |
| Finding shape and severity | `references/findings.md` |
| Review lenses | `references/lenses.md` |
| Explicit requirement / acceptance comparison | `references/spec-compliance.md` |
