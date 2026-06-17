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

## Full mode

Use full mode when continuity, traceability, or coordination matters.

Full mode output:

- durable planning artifacts;
- explicit phase state;
- review record;
- verification record;
- capture record for project documentation or handoff.

Full mode works best for phased work, multi-session work, risky changes, and coordinated subagent execution.

## Rigor escalation

Increase rigor for productizing, maintenance, or critical work; data loss; migrations; auth, security, billing, cloud, SSH, or secrets; public APIs; concurrency or consistency; irreversible operations; deployment; and multi-user impact.

Use stronger review and verification as blast radius increases. The mode stays proportional, but safety-critical work cannot use fast mode just because the code diff is small.

## Selection rule

Start with the smallest mode that can preserve the facts another maintainer or agent needs to verify the result. Increase the mode when risk, ambiguity, coordination, or time span increases.
