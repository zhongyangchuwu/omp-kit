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
- preparing completion evidence or a project-requested `VERIFICATION.md`;
- deciding whether work is ready for capture or shipping.

## Workflow

1. List the claims that must be true for the work to be done.
2. Map each claim to the strongest practical evidence.
3. Inspect applicable existing evidence, including current-candidate CI; run additional checks only for changed state or missing coverage.
4. Check coverage across existence, implementation, wiring, behavior, regression, and user acceptance where relevant.
5. Record observed evidence, gaps, and result in the response, owning PR, or a durable artifact when the project needs it.
6. Route gaps to revision, escalation, or abort.

## Rules

- Verification proves exercised properties; review judges quality and risk.
- A passing build or lint check proves only the property it checks.
- File existence does not prove implementation.
- Implementation does not prove wiring.
- Wiring does not prove user-visible behavior.
- Claims without observed evidence remain unverified.
- Verification output distinguishes passed checks, failed checks, skipped checks, and untested claims.
- Do not repeat an unchanged passing full gate solely because the workflow reached a completion phase.
- A record template is optional structure, not a requirement to add another repository file.

## Support files

| Need | Load |
| --- | --- |
| Evidence levels | `references/evidence-levels.md` |
| Stub and placeholder checks | `references/stub-checks.md` |
| UAT records | `references/uat.md` |
| Verification record shape | `references/verification-record.md` |
