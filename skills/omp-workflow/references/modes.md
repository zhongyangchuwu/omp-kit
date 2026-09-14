# Workflow Modes

## Fast mode

Use fast mode when the task is clear, local, and low risk.

Fast mode output:

- implemented change;
- direct verification evidence;
- concise completion note.

Fast mode works best for single-file fixes, small tests, typo corrections, and obvious local behavior changes.

## Focused mode

Use focused mode when the task is bounded but benefits from written intent.

Focused mode output:

- a compact plan or task list;
- implementation summary;
- review or verification notes when relevant.

Focused mode works best for small features, multi-file fixes, and changes with a few known risks.

## Durable project mode

Use durable project mode when continuity, traceability, or coordination matters across sessions.

Default to the issue-centered project-state model in `project-state.md`:

- current accepted truth in current docs/executable policy;
- a short `docs/WORKING_STATE.md` navigation index when useful;
- concrete unfinished problems in Issues;
- implementation/review/CI evidence in PRs;
- durable rationale in design records only when worth preserving.

This mode works well for multi-session development without requiring a phase artifact tree.

## Specialized phase mode

Use the `.planning/` lifecycle only when the project deliberately needs a richer local/offline phase dossier, ordered roadmap/requirements artifacts, or explicit phase archival state.

Its outputs may include PROJECT/REQUIREMENTS/ROADMAP/STATE plus phase-local context, plans, summaries, verification, and capture records. Do not select this mode merely because a task is large or lasts more than one session.

Load `initialization.md` and `phase-lifecycle.md` only after choosing this mode explicitly.

## Rigor escalation

Increase rigor for productizing, maintenance, or critical work; data loss; migrations; auth, security, billing, cloud, SSH, or secrets; public APIs; concurrency or consistency; irreversible operations; deployment; and multi-user impact.

Use stronger review and verification as blast radius increases. The mode stays proportional, but safety-critical work cannot use fast mode just because the code diff is small.

## Selection rule

Start with the smallest mode that can preserve the facts another maintainer or agent needs to recover and verify the result. Increase rigor when risk, ambiguity, coordination, or time span increases; increase artifact count only when those artifacts solve a concrete continuity or traceability problem.