---
name: omp-verification
description: Use when proving that a change works, validating acceptance criteria, checking behavior coverage, running UAT, detecting stubs/placeholders, or preparing completion evidence before declaring work done.
---

# OMP Verification

## Focus

OMP Verification owns completion evidence. It maps claims to checks, runs or inspects the evidence, records coverage, and names gaps before work is declared done.

## Activation

Use this skill when the task involves:

- proving a feature, bug fix, refactor, migration, or integration works;
- validating acceptance criteria;
- checking behavior against a plan, requirement, or user story;
- detecting stubs, placeholders, or unwired code;
- running user acceptance testing;
- preparing a `VERIFICATION.md` or completion evidence;
- deciding whether work is ready for capture or shipping.

## Workflow

1. List the claims that must be true for the work to be done.
2. Map each claim to the strongest practical evidence.
3. Run, inspect, or collect the selected evidence.
4. Check coverage across existence, implementation, wiring, behavior, regression, and user acceptance where relevant.
5. Record observed evidence, gaps, and result.
6. Route gaps to revision, escalation, or abort.

## Rules

- Verification proves behavior; review judges quality and risk.
- A passing build or lint check proves only the property it checks.
- File existence does not prove implementation.
- Implementation does not prove wiring.
- Wiring does not prove user-visible behavior.
- Claims without observed evidence remain unverified.
- Verification output must distinguish passed checks, failed checks, skipped checks, and untested claims.

## Support files

| Need | Load |
| --- | --- |
| Evidence levels | `references/evidence-levels.md` |
| Stub and placeholder checks | `references/stub-checks.md` |
| UAT records | `references/uat.md` |
| Verification record shape | `references/verification-record.md` |
