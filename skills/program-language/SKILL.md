---
name: program-language
description: Use when choosing or configuring language-specific project tooling, package managers, formatters, linters, test runners, type checkers, common libraries, ecosystem docs, or stack conventions. Currently covers Go and Python.
---

# Program Language

## Focus

Language-specific ecosystem guidance for project development. This skill owns toolchain choices, package workflow, formatter/linter/test/type-check setup, library shortlists, and authoritative documentation for a single programming language.

## Activation

Use this skill when starting a language project, evaluating tools or libraries, setting up language-specific quality tooling, choosing framework-adjacent packages, or checking ecosystem conventions.

## Workflow

1. Detect the project language from repository markers or the user's stated target.
2. Load the matching language support file.
3. Identify the boring default toolchain and library candidates.
4. Choose based on project size, runtime constraints, maintenance status, and team familiarity.
5. Link authoritative docs for recommendations that depend on external APIs or current tooling behavior.

## Rules

- Work one language at a time.
- Prefer standard formatters and mainstream maintained tooling.
- Keep small scripts and prototypes small.
- Commit ecosystem reproducibility files when the language workflow expects them.
- Use one test layout convention per project.
- Scale lint, type-check, build, and CI recommendations to the project's stage and maintenance horizon.

## Support files

| Need | Load |
| --- | --- |
| Go project guidance | `references/go.md` |
| Python project guidance | `references/python.md` |
| Cross-language API, observability, and deployment references | `references/shared.md` |

Additional languages follow the same focused support-file shape.

## Output

When useful, provide the candidate scaffold or setup command, selected toolchain, library shortlist, tradeoffs, and source links.
