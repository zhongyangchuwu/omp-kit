# Maintenance and usage workflows

## Install/update

Use the [native plugin workflow](omp-installation.md). Install the committed Bun graph, link the checkout, inspect registration and restart affected sessions. Model/provider/MCP configuration remains user-owned. The retired config-copy installer is not the update path.

## Maintain Skills

Keep useful Skills, references, templates, scripts and tests. `skills/<name>/SKILL.md` plus its support files own current Skill behavior; OMP discovers the active tree directly.

Review third-party material outside active discovery paths first, for example in an ignored `references/` checkout or a temporary branch/worktree. Only copy reviewed material into `skills/` when it is ready to be active. Git history is the recovery path for retired drafts and earlier designs; there is no mandatory draft registry or promotion metadata workflow.

Use `skill-authoring` for content and supply-chain review. Environment-native security scanners can provide additional evidence when useful, but omp-kit does not maintain a bespoke heuristic risk scanner. Correct concrete errors and duplicated obligations. Do not remove personal design or code-quality experience simply because the guidance is general-purpose.

## Implement, integrate, verify

Use focused tests while making a change. Main reconciles writable scopes and shared consumers before accepting the combined tree. Workers report out-of-scope findings rather than expanding their task.

`just verify` is the repository's provider-free gate. It runs Bun repository/native-resource/Skill/documentation contracts plus TypeScript typecheck and runtime tests. CI also checks the committed Bun graph, candidate diff and tracked-file drift.

PR merge-ref CI is the normal pre-merge mechanical evidence. Post-landing `main` CI answers the distinct landed-tree question. Do not repeat a successful unchanged full gate merely because another worker received ownership. A focused repair, changed candidate, local-runtime claim or CI diagnosis can justify new checks.

Review judges semantics, intent and risk; tests prove only exercised properties. No documentation cleanup authorizes live cloud resources, provider calls or user-profile mutation.

## Normal runtime use

Main uses `omp-workflow` and chooses direct work or bounded delegation. The various maintained design, research, test and quality Skills contribute when their task boundary matches; they do not all need to be loaded for every task.

Use task-local Issue/PR ownership for multi-session work when durable coordination is useful. Keep accepted behavior and rationale in current docs/design records, not only in Issues. Do not create a parallel phase dossier or local backlog mirror merely to preserve cross-session state.

## Observe and preserve

Main or a worker may record reusable friction already encountered through `omp_kit_feedback`. Do not manufacture a reflection turn to find something to log.

After normal work, use `evidence:collect` and `evidence:report` for quantitative session summaries. The CLI does not install a background scheduler. Routine data stays outside Git; select compact decision evidence into `evidence/experiments/` only when useful. See [session evidence](session-evidence.md) and [experiment lifecycle](experiments.md).

Preserve stable accepted decisions in their owning docs. Keep unresolved coordination task-local in Issues/PRs when useful, review/CI in PRs, and pure historical chronology in Git rather than introducing another global navigation or archive mirror.
