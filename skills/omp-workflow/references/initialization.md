# Specialized Phase-Mode Initialization

Initialize `.planning/` only after the project deliberately chooses the specialized phase lifecycle. Missing `.planning/` is never, by itself, a reason to offer or create it.

For ordinary multi-session repository work, prefer the issue-centered model in `project-state.md`.

## Choose this mode when

Use `.planning/` when the extra local artifacts solve a concrete need such as:

- an ordered multi-phase program with stable requirement-to-phase traceability;
- work that must remain usable offline without GitHub Issue/PR state;
- a phase dossier whose plans, summaries, verification, and archive are themselves valuable deliverables;
- a user explicitly requesting this workflow.

Do not choose it merely because a project is large, brownfield, or expected to span multiple sessions.

## Bootstrap

Create only the root artifacts needed by the phase lifecycle:

```text
.planning/
  PROJECT.md
  REQUIREMENTS.md
  ROADMAP.md
  STATE.md
```

Optional codebase maps or phase-local artifacts are added when the work actually reaches those stages.

## PROJECT.md

Capture durable product intent, not implementation chronology:

```markdown
# <Project Name>

## What This Is
<short description and intended user>

## Core Value
<one tradeoff-driving sentence>

## Requirements
### Validated
- <existing shipped capability>

### Active
- [ ] <current requirement>

### Out of Scope
- <exclusion> — <reason>

## Constraints
- ...

## Key Decisions
- ...
```

For brownfield work, populate `Validated` from observed existing behavior rather than assumptions.

## REQUIREMENTS.md

Use stable IDs only when traceability is useful:

```markdown
# Requirements

- [ ] **API-01**: <user-visible, testable, atomic requirement>
- [ ] **UX-01**: <requirement>

## Deferred
- ...

## Traceability
| Requirement | Phase | Status |
| --- | --- | --- |
| API-01 | 1 | Pending |
```

Do not invent requirement categories or IDs merely to make the document look formal.

## ROADMAP.md

Define coherent phases with observable outcomes:

```markdown
# Roadmap

- [ ] **Phase 1: <name>** — <outcome>
- [ ] **Phase 2: <name>** — <outcome>

## Phase 1
**Goal:** ...
**Depends on:** ...
**Requirements:** API-01
**Success criteria:**
1. <observable behavior>
```

Prefer a small number of meaningful phases. Decimal insertion is acceptable for genuinely urgent work between existing phases; do not use it as a generic backlog system.

## STATE.md

Keep state compact and recovery-oriented:

```markdown
# Project State

**Current focus:** Phase 1: <name>
**Status:** not-started | discussing | planning | executing | verifying | complete
**Last activity:** <date + short fact>

## Decisions
- ...

## Blockers
- ...

## Resume
<next concrete action or phase-local handoff reference>
```

Read it at the start of a phase-mode session, but confirm actual repository/runtime state before trusting stale observations.

## Optional AGENTS.md

Create/update an agent context file only when stable repository conventions need to control future agents. Do not copy the planning artifacts into it.

## Brownfield grounding

When existing code materially affects requirements or architecture, use `codebase-exploration.md` before finalizing PROJECT/REQUIREMENTS. Skip exploration when the relevant code is already understood well enough from direct repository evidence.

## Completion

Initialization is complete when:

- product intent and current scope are understandable;
- active requirements map to coherent phases;
- `STATE.md` points to the first real next action;
- the project can enter the explicit phase lifecycle in `phase-lifecycle.md`.

Do not create phase-local CONTEXT/PLAN/SUMMARY/VERIFICATION/CAPTURE files until their lifecycle state requires them.