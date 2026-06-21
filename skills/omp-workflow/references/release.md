# Release and Archive

Release is a post-completion workflow for a real published version. Phases remain the development planning unit; release groups completed phases after the fact and moves historical planning content out of root docs.

## When to release

Cut a release when:

- the project is publishing a version such as `v1.0.0`, `v1.1.0`, or `v2.0.0`;
- selected phases are complete and verified;
- completed planning history should move out of active root docs before new work continues.

Do not use release for internal cleanup checkpoints or future planning buckets. Use normal phase completion for ongoing development tracking.

## Release flow

1. Confirm the version is a real published identifier, usually `vX.Y.Z`.
2. Select completed phases included in the release.
3. Verify each selected phase has completion evidence:
   - `SUMMARY.md` records implementation outcome;
   - `VERIFICATION.md` records observed evidence;
   - known gaps are recorded.
4. Extract completed content from root planning docs:
   - `ROADMAP.md` completed phase details -> release `SUMMARY.md`;
   - `REQUIREMENTS.md` completed requirements -> release `SUMMARY.md`;
   - `PROJECT.md` superseded facts or decisions -> release `SUMMARY.md`.
5. Write release archive documents:
   - `.planning/archive/releases/<version>/SUMMARY.md`;
   - `.planning/archive/releases/<version>/VERIFICATION.md`.
6. Move phase directories:
   - `.planning/phases/<phase>/` -> `.planning/archive/releases/<version>/phases/<phase>/`.
7. Clean current-state artifacts:
   - update `.planning/archive/INDEX.md` with the release;
   - remove released phase details from `ROADMAP.md`;
   - remove released requirements from `REQUIREMENTS.md`;
   - update `PROJECT.md` to current facts only;
   - update `STATE.md` to the next active phase or `ready`.
8. Update repository `CHANGELOG.md` if the project already maintains one.

## Release gate

Before archiving, confirm:

- The release version is a published version, not a cleanup label.
- Every selected phase is complete.
- Release `SUMMARY.md` contains the completed scope removed from root docs.
- Release `VERIFICATION.md` points to phase evidence and records known gaps.
- Root planning docs describe only current and future work after the release.
- `STATE.md` does not point at archived phase paths.
- Repository `CHANGELOG.md` updated if it already exists.

## Archive lookup

When searching for a phase:

1. Check `.planning/phases/<phase>/` first.
2. Fall back to `.planning/archive/releases/*/phases/<phase>/`.
3. If the phase is archived, report the release version and full path.
