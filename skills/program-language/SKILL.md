---
name: program-language
description: Use as a quick reference for programming language project development: ecosystem docs, common tools, library candidates, and convention pointers. Currently covers Go and Python.
---

# Program Language

Quick reference for modern engineering practice and tech stack choices in a specific programming language. Not a syntax reference, style guide, or rulebook — it is an ecosystem map: common tools, popular libraries, authoritative docs, and tradeoffs to check before choosing dependencies.

## Boundary

Use this skill when:

- starting a new project and need scaffolding, toolchain, and library recommendations;
- evaluating libraries or tools for an existing project;
- setting up linting, testing, formatting, or CI for a language ecosystem;
- the task involves stack decisions (router, ORM, logger, config, CLI framework).

Do not use it for:

- language syntax or tutorial questions; use official docs or Context7 instead;
- framework-specific API details; fetch current docs;
- architecture decisions that span multiple languages or services;
- pure code-review judgment; that belongs to code-taste.

## Operating principle

One language at a time. Detect the project language from the repo (e.g. `go.mod` → Go, `pyproject.toml` → Python), load the matching reference, and use it as a shortlist of options. If the language is not yet covered, say so and fall back to general principles.

Prefer boring, community-standard choices over novelty when the project has no stronger constraint. Small scripts and prototypes should stay small; do not add a framework or config system just because it appears in the guide.

## Workflow

1. Detect the project language from the repo root.
2. Load the corresponding file under `references/`.
3. Use the reference to identify candidate tools and libraries, then choose based on project size, runtime constraints, team familiarity, and maintenance status.
4. Link to authoritative docs for every recommendation so the user can inspect the source.

## Cross-language heuristics

These are defaults, not hard requirements:

- **Reproducibility**: commit the ecosystem's reproducibility files when applicable (for Go, `go.sum`; for app projects in lock-file ecosystems, the lock file).
- **Linting**: use a mainstream linter when the project will be maintained beyond a throwaway script.
- **Formatting**: prefer the language's standard formatter or dominant community formatter.
- **Tests**: pick one test layout convention per project and keep it consistent.
- **Docs**: at minimum keep a README with build, test, run, and configuration instructions. Add API docs or ADRs when the project has public APIs or non-obvious architectural decisions.

## Reference routing

| Need | Read |
| --- | --- |
| Go project guidance | [go.md](references/go.md) |
| Python project guidance | [python.md](references/python.md) |
| Cross-language API, observability, and deployment references | [shared.md](references/shared.md) |

Additional languages will appear as `references/<language>.md`.

## Output expectations

When useful, produce:

- candidate scaffolding command or template;
- optional toolchain setup (lint, fmt, test, build), scaled to project size;
- library shortlist for the project's domain, with rationale and tradeoffs;
- links to official docs for every recommendation.
