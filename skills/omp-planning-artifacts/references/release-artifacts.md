# Release Archive Artifacts

Release archives live under `.planning/archive/releases/<version>/`. Only published versions, usually `vX.Y.Z`, qualify as releases.

## Archive structure

```text
.planning/archive/
  INDEX.md
  releases/
    <version>/
      SUMMARY.md
      VERIFICATION.md
      phases/
        001-short-name/
          ... phase-local artifacts
```

## archive/INDEX.md

`archive/INDEX.md` catalogs archived releases. Required sections:

- `# Planning Archive`
- `## Releases`
- Release table with `Version`, `Date`, and `Summary` columns.

Example:

```markdown
# Planning Archive

## Releases

| Version | Date | Summary |
| --- | --- | --- |
| v1.0.0 | 2026-06-21 | [Initial release](releases/v1.0.0/SUMMARY.md) |
```

## Release SUMMARY.md

`SUMMARY.md` is the maintainer-readable history for what shipped. It combines completed roadmap scope, completed requirements, notable decisions, and follow-ups removed from root planning docs.

Required sections:

- `Released` — date.
- `What Shipped` — one short paragraph.
- `Included Phases` — phase ids and names.
- `Completed Scope` — roadmap items and requirements moved from root docs.
- `Notable Decisions` — durable decisions, rationale, outcome, and source phase.
- `Follow-ups` — deferred work or `None`.

Example:

```markdown
# v1.0.0 Summary

## Released
2026-06-21

## What Shipped
One paragraph.

## Included Phases
- 001-foundation
- 002-auth

## Completed Scope

### Roadmap Items
- Phase 001: goal and final status.
- Phase 002: goal and final status.

### Requirements
- REQ-001 — outcome.
- REQ-002 — outcome.

## Notable Decisions
- Decision: rationale, outcome, source phase.

## Follow-ups
None.
```

## Release VERIFICATION.md

`VERIFICATION.md` records release-level confidence. It points to phase evidence and records coverage; it does not duplicate phase verification files.

Required sections:

- `Result` — `Passed`, `Passed with known gaps`, or `Failed`.
- `Claims Verified` — release claims checked.
- `Evidence` — links to archived phase verification artifacts.
- `Coverage` — requirements and checks covered.
- `Known Gaps` — listed gaps or `None`.

Example:

```markdown
# v1.0.0 Verification

## Result
Passed

## Claims Verified
- Claim 1.
- Claim 2.

## Evidence
| Phase | Verification |
| --- | --- |
| 001-foundation | phases/001-foundation/VERIFICATION.md |
| 002-auth | phases/002-auth/VERIFICATION.md |

## Coverage
- Requirements covered: REQ-001, REQ-002
- Automated checks: ...
- Manual checks: ...

## Known Gaps
None.
```

## Section rule

Use `None` for an intentionally empty required section. Do not omit required sections.

## Repository changelog

A top-level `CHANGELOG.md` is project documentation, not a planning archive artifact. Update it during release only when the repository already maintains one or the user requests one. Do not create a planning-local changelog.
