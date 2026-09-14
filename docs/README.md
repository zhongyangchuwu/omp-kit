# Documentation map

Keep this directory biased toward **current** product truth. Git history plus completed Issues/PRs preserve chronology; do not maintain a parallel archive tree for information that is no longer current.

## Current docs

- [`WORKING_STATE.md`](WORKING_STATE.md) — short mutable project index, active/inactive work and next action.
- [`architecture.md`](architecture.md) — product ownership and Core / Companion / Integration boundaries.
- [`VALIDATION.md`](VALIDATION.md) — current accepted CI/runtime evidence and its limits.
- [`omp-compatibility.md`](omp-compatibility.md) — impact-based OMP release compatibility policy.
- [`session-evidence.md`](session-evidence.md) — compact OMP-native session evidence product, storage and schema.

Executable behavior lives in `agents/`, `skills/`, `rules/`, `extensions/` and `scripts/session_evidence.ts`. When prose and observable behavior disagree, investigate the current tree/runtime and fix the stale current document.

## State ownership

```text
intent / authorization       -> user
current observable state     -> repository/runtime read-back
accepted product policy      -> executable resources + current docs
unfinished work              -> open Issues
implementation/review/CI     -> Pull Requests / Actions
chronology                   -> Git + Issue/PR history
```

Do not recreate removed history-only files merely to make the repository self-contained offline. Restore a historical file from Git only when a concrete current task needs it.
