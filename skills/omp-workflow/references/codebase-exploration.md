# Codebase Exploration

Map an existing codebase into structured documents under `.planning/codebase/` so that initialization, discussion, and planning phases can ground decisions in what already exists.

## When to use

Use when:

- Initializing a brownfield project (existing code, no `.planning/`).
- A phase discussion or plan needs current codebase context beyond what memory provides.
- The codebase has changed significantly since the last map was written.

## Detection

Check whether `.planning/codebase/` already exists:

- If it exists: offer refresh, update specific documents, or skip.
- If it does not exist: proceed with exploration.

If AGENTS.md (or equivalent) exists, read it first — it contains project conventions and constraints that scope the exploration.

## Exploration strategy

Parallel exploration using `task` subagents is preferred when the agent tool is available. Each agent explores one dimension and writes its document directly. Fall back to sequential exploration when subagents are unavailable.

**Do not use browser subagents for codebase exploration.** Use filesystem tools only: `read`, `search`, `find`, `lsp`.

## Parallel exploration (preferred)

Create `.planning/codebase/` and spawn 3-4 `task` subagents in parallel. Each agent writes its document(s) directly to `.planning/codebase/`.

### Agent assignments

**Agent 1: Structure & Architecture**

```
# Target
Write observations to .planning/codebase/STRUCTURE.md and
.planning/codebase/ARCHITECTURE.md.

# What to map
- Directory layout: key directories at each depth, what lives where.
- Entry points: main files, CLI commands, server start, build targets.
- Module boundaries: where subsystems meet, import/export patterns.
- Data flow: how data moves through the system — sources, transforms, sinks.
- Design patterns: MVC, layered, hexagonal, pipeline, plugin, event-driven.

# Output format
Include actual file paths formatted with backticks (`src/services/auth.ts`).
Each document should be >20 lines of substantive content, not boilerplate.
```

**Agent 2: Tech Stack**

```
# Target
Write observations to .planning/codebase/STACK.md.

# What to map
- Languages, runtime, and version constraints.
- Package manager (npm, uv, cargo, go mod) and key dependencies.
- Frameworks and major libraries with versions.
- Configuration: env vars, config files, feature flags.
- External integrations: databases, APIs, auth providers, message queues, storage.

# Output format
Include actual file paths and version numbers where discoverable.
Document should be >20 lines.
```

**Agent 3: Conventions & Testing**

```
# Target
Write observations to .planning/codebase/CONVENTIONS.md.

# What to map
- Code style: formatting, linting, naming conventions.
- Error handling patterns: how errors propagate, log, recover.
- Common patterns: how things are typically done in this codebase.
- State management: stores, reducers, contexts, singletons.
- Testing: framework, test file location convention, mocking approach, coverage expectations.
- Build and CI: build steps, lint gates, test commands.

# Output format
Include concrete code snippets showing the convention, with file paths.
Document should be >20 lines.
```

**Agent 4: Concerns**

```
# Target
Write observations to .planning/codebase/CONCERNS.md.

# What to map
- Technical debt: TODO comments, deprecated patterns, known workarounds.
- Fragile areas: tight coupling, god objects, untested critical paths.
- Security: hardcoded secrets, missing input validation, unsafe dependencies.
- Performance: N+1 queries, unbounded collections, blocking I/O, memory patterns.
- Missing pieces: gaps in test coverage, missing error handling, absent documentation.

# Output format
Each concern should name the file, line (if known), the risk, and the impact.
Document should be >20 lines.
```

### Collect and verify

Wait for all agents to complete, then verify:

- All documents exist and are >20 lines.
- No document is empty or pure boilerplate.

If an agent failed, note which documents are missing and offer to fill them sequentially.

### Write MAP.md

Create `.planning/codebase/MAP.md` as a summary index:

```markdown
# Codebase Map

**Mapped:** <date>

## Documents

| Document | Lines | Summary |
|---|---|---|
| STRUCTURE.md | <N> | <One-line key finding> |
| ARCHITECTURE.md | <N> | <One-line key finding> |
| STACK.md | <N> | <One-line key finding> |
| CONVENTIONS.md | <N> | <One-line key finding> |
| CONCERNS.md | <N> | <One-line key finding> |

## Key Takeaways

<3-5 most important facts for planning>
```

## Sequential fallback

When `task` subagents are unavailable, explore in order:

1. Structure & Architecture → STRUCTURE.md, ARCHITECTURE.md
2. Tech Stack → STACK.md
3. Conventions & Testing → CONVENTIONS.md
4. Concerns → CONCERNS.md

Each pass uses `read`, `search`, `find`, and `lsp` to explore. Write each document before starting the next pass. Follow the same content requirements as the parallel agents.

Use `search` to find patterns (e.g., `pattern: "TODO|FIXME|HACK"` for concerns), `find` to map directory structure, `read` to inspect representative files, and `lsp` for symbol-aware navigation (references, definitions).

## Usage

After exploration completes:

- `initialization.md` (brownfield path) reads MAP.md, ARCHITECTURE.md, and STRUCTURE.md to populate PROJECT.md Validated requirements.
- `discuss-phase` / `plan-phase` may read relevant codebase documents for current implementation context.
- CONCERNS.md feeds into phase planning as potential tasks or risks to address.

## Refresh

If `.planning/codebase/` already exists and the codebase has changed:

1. Show existing documents and their mapped dates.
2. Offer: refresh all, update specific documents, or skip.
3. If refreshing, delete `.planning/codebase/` and re-run exploration.
4. If updating, re-run only the selected agent assignments.
