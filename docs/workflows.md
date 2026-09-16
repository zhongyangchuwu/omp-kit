# Maintenance and usage workflows

## Install/update

Use the [native plugin workflow](omp-installation.md). Install the committed Bun graph, link the checkout, inspect registration and restart affected sessions. Model/provider/MCP configuration remains user-owned. The retired config-copy installer is not the update path.

## Maintain Skills

Keep useful Skills, references, templates, scripts and tests. `skills/<name>/SKILL.md` plus its support files own current Skill behavior; OMP discovers the active tree directly.

Review third-party material outside active discovery paths first, for example in an ignored `references/` checkout or a temporary branch/worktree. Only copy reviewed material into `skills/` when it is ready to be active. Git history is the recovery path for retired drafts and earlier designs; there is no mandatory draft registry or promotion metadata workflow.

`just scan-risk PATH` remains an optional review aid for suspicious textual patterns. It is not a sandbox, policy engine or substitute for reading executable code and checking side effects.

Consult `skill-authoring` for content review. Correct concrete errors and duplicated obligations. Do not remove personal design or code-quality experience simply because the guidance is general-purpose.

## Implement, integrate, verify

Use focused tests while making a change. Main reconciles writable scopes and shared consumers before accepting the combined tree. Workers report out-of-scope findings rather than expanding their task.

`just verify` is the repository's provider-free gate. It runs retained Python/native-plugin and Skill-library checks, Skill-authoring tests, isolated AutoDL mocked tests, and TypeScript typecheck/tests. CI checks lockfile freshness, the candidate diff and tracked-file drift as well.

PR merge-ref CI is the normal pre-merge mechanical evidence. Post-landing `main` CI answers the distinct landed-tree question. Do not repeat a successful unchanged full gate merely because another worker or phase received ownership. A focused repair, changed candidate, local-runtime claim or CI diagnosis can justify new checks.

Review judges semantics, intent and risk; tests prove only exercised properties. No documentation cleanup authorizes live cloud resources, provider calls or user-profile mutation.

## Normal runtime use

Main uses `omp-workflow` and chooses direct work or bounded delegation. The various maintained design, research, test and quality Skills contribute when their task boundary matches; they do not all need to be loaded for every task.

Use issue-centered project state for ordinary multi-session work. Keep accepted behavior and rationale in current docs/design records, not only in Issues. Use the preserved `.planning/` workflow only when deliberately selected for a project needing that specialized dossier.

## Observe and preserve

Main or a worker may record reusable friction already encountered through `omp_kit_feedback`. Do not manufacture a reflection turn to find something to log.

After normal work, use `evidence:collect` and `evidence:report` for quantitative session summaries. The CLI does not install a background scheduler. Routine data stays outside Git; select compact decision evidence into `evidence/experiments/` only when useful. See [session evidence](session-evidence.md) and [experiment lifecycle](experiments.md).

Preserve stable accepted decisions in their owning docs. Keep current navigation short, unfinished work in Issues, review/CI in PRs, and pure historical chronology in Git rather than duplicate archive files.
