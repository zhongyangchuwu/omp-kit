# Codebase Exploration

Use this reference only inside an explicitly selected or existing `.planning/` workflow when a reusable brownfield map will be consumed by later planning work. Ordinary repository tasks should inspect the codebase directly; do not create `.planning/` merely to produce a map.

## When a map earns its cost

Create or refresh `.planning/codebase/` when one of these is true:

- a selected brownfield planning dossier needs durable repository context before root artifacts or phases can be defined;
- several later phases are likely to reuse the same architecture, stack, convention, or concern observations;
- an existing map is materially stale and that stale fact would affect a current planning decision.

Skip the map when direct inspection for the current task is cheaper and sufficiently reliable.

## Possible artifacts

Create only the documents with a real downstream consumer:

```text
.planning/codebase/
  MAP.md
  STRUCTURE.md
  ARCHITECTURE.md
  STACK.md
  CONVENTIONS.md
  CONCERNS.md
```

Typical ownership:

- `STRUCTURE.md` — key directories, entry points, and module boundaries;
- `ARCHITECTURE.md` — data flow, subsystem relationships, and important design patterns;
- `STACK.md` — languages, runtimes, dependencies, configuration, and external integrations;
- `CONVENTIONS.md` — implementation, testing, error-handling, build, and CI conventions;
- `CONCERNS.md` — concrete technical risks or gaps grounded in repository evidence;
- `MAP.md` — mapped date/revision context, links to the artifacts that actually exist, and a compact set of key takeaways.

There is no line-count quota and not every map needs every file. Empty boilerplate is worse than an omitted artifact.

## Exploration workflow

1. Read the repository's current agent/contributor instructions and inspect actual repository state.
2. Name the planning decision or later phase that will consume the map, then select only the dimensions needed for it.
3. Choose Main-direct, one bounded delegate, or parallel independent delegates using normal `omp-workflow` economics. Parallelism is not preferred by default.
4. Ground observations in current repository evidence: concrete paths, symbols, configuration, dependency versions, tests, or CI where relevant.
5. Write only the selected artifacts, then make `MAP.md` a small index and summary rather than another full copy.
6. Root-artifact creation or later phase work reads only the map sections relevant to its decision.

Filesystem/repository inspection is the authority for codebase facts. A concern is an observation to investigate, not a security, quality, or priority verdict by itself.

## Refresh

Before refreshing, identify what became stale. Update only the affected map artifacts when practical; do not delete and regenerate the whole directory by ritual.

If the map's assumptions no longer match the repository, record the new observed facts and update `MAP.md` so later consumers do not treat the older snapshot as current. Preserve useful still-valid context instead of rewriting unrelated sections.
