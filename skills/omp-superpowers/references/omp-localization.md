# Oh My Pi Localization Notes

Superpowers is explicit-only in this repository. Do not apply the upstream auto-bootstrap rule globally. The user must explicitly ask for Superpowers, ask about Superpowers, ask to localize/modify this collection, or name a Superpowers workflow.

## Activation

- Active skill: `omp-superpowers`.
- Upstream files under `references/skills/*` are reference material, not separately auto-discovered skills.
- Do not treat `references/skills/using-superpowers/SKILL.md` as a session-start policy.
- When the user asks for a specific workflow, read that workflow's `SKILL.md` and adapt it through these notes.

## Tool mapping

Use Oh My Pi tools and policies instead of upstream Claude/Codex/Gemini tool names:

| Upstream wording | Oh My Pi handling |
| --- | --- |
| Upstream skill invocation mechanisms | Load the relevant file under `references/skills/<name>/SKILL.md` when Superpowers is explicitly active. |
| Upstream file-access wording | `read` for files, directories, archives, URLs, and documents. |
| Upstream file-creation wording | `write` for new files; prefer `edit` for existing files. |
| Upstream todo tracker wording | `todo_write`. |
| Upstream subagent wording | `task` with the narrowest suitable agent (`task`, `quick_task`, `reviewer`, `oracle`, or another available type). |
| Bash search/list/read snippets | Prefer `search`, `find`, and `read`; use `bash` only when no specialized tool applies. |
| GitHub CLI PR operations | Prefer `github` for PR creation, checkout, push, search, and run watch. |

## State and artifacts

Preserve these upstream paths unless the user requests another location:

- Specs: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Plans: `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- Optional visual companion state: `.superpowers/brainstorm/<session-id>/`
- Optional project-local worktrees: `.worktrees/` or `worktrees/`

If `.superpowers/`, `.worktrees/`, or `worktrees/` are used in a project, ensure they are gitignored before relying on them for generated state.

## Workflow policy

- Do not start using Superpowers for ordinary coding by default.
- If the user asks to use the full methodology, route through design -> spec -> plan -> isolated execution -> TDD -> review -> verification -> finish.
- Treat upstream hard gates as active only after explicit Superpowers activation.
- User instructions and repository-specific instructions still override Superpowers.
- For implementation work, use the repository's existing tool/test conventions and Oh My Pi dedicated tools.

## Subagent adaptation

When upstream templates say `Task tool (general-purpose)`, convert them to Oh My Pi `task` calls:

- Implementation tasks: use `task` or `quick_task` only when scope is narrow and self-contained.
- Code/spec review: prefer `reviewer` when available.
- Architecture or unclear blockers: use `oracle` or ask the user only when tools cannot answer.
- Never make subagents run project-wide build/test/lint; the controller verifies once at integration points.

## Shell snippet adaptation

Upstream examples may use shell commands such as `ls`, `grep`, `cat <<EOF`, `awk`, `sed`, or `cd`. In Oh My Pi:

- File discovery uses `find`.
- Content search uses `search`.
- File reads use `read`.
- Existing-file modifications use `edit`.
- New files use `write`.
- Use `cwd` on `bash` calls instead of shell `cd`.
- Do not use shell redirection or heredocs for file writes; use `write`.

## Upstream bootstrap override

The upstream `using-superpowers` skill says Superpowers should be checked before every response. That rule is intentionally disabled in this local version. The local trigger is explicit user intent only.
