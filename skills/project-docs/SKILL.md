---
name: project-docs
description: Use when writing, updating, auditing, or translating project documentation in Chinese or English, including READMEs, how-to guides, reference, and design explanations; grounds claims in project evidence and keeps prose natural, concise, and non-repetitive.
---

# Project Docs

## Focus

Help readers understand a project or complete a task with accurate, maintainable documentation. Own the documentation change, not implementation, document extraction, or marketing copy.

## Activation

Use for new project documentation, documentation maintenance, factual or editorial audits, and translation of existing technical documentation. Follow the requested language; otherwise preserve the target document's language and conventions. Supporting Chinese and English does not mean producing both by default.

## Workflow

1. Identify the reader, their task, and the requested operation: audit, write, edit, or translate. Read [the style guide](references/style.md) before reviewing or changing prose.
2. Read the relevant existing documentation and project evidence: code, configuration, tests, and accepted design decisions. Establish current behavior from the implementation; use design records for intent and rationale. Distinguish implemented behavior from proposals. Resolve questions from the project before asking the user.
3. Find the existing home for the information. Prefer updating it or linking to its maintained owner. Create a file only for a distinct reader need or an explicit requested destination. Use tutorial, how-to, reference, or explanation as a guide, not a directory or section checklist. No documentation change is a valid outcome when nothing useful is missing.
4. Make the smallest complete change. For an audit, report concrete issues with locations, evidence, and suggested corrections; do not rewrite without authorization. For writing or editing, retain existing operational prerequisites, constraints, and unrelated content. For translation, preserve meaning, technical identifiers, and the source unless asked to change it. Do not invent commands, options, defaults, errors, or capabilities. If a needed fact remains unavailable, omit the unsupported claim and identify the specific gap once in the delivery note.
5. Verify the affected claims, paths, links, and examples. Run safe, relevant commands when the environment permits; check the observed result, not just the exit status. Do not perform destructive or external operations just to validate prose. Check other affected documentation for stale statements. Report unexecuted checks as such.
6. Deliver the requested document, patch, or audit findings. For repository edits, briefly name the changed files, checks actually performed, and any specific unresolved fact. When no change is supported, return only a short reason, for example: “No change: neither the code nor the design record defines a timeout default.” Omit document/proposal headings and a separate note in that outcome. Do not append a second summary of the document or create a work-log document.

## Delivery check

- Technical claims match the available evidence; examples include the prerequisites and results needed to use them.
- The reader can follow the task without losing a necessary condition, warning, failure case, or design reason.
- Each passage has a job; repeated conclusions, empty transitions, and generic disclaimers are removed according to the style guide.
- The change has one maintained home, respects the requested language and scope, and leaves affected documents consistent.

## Support files

- [Style guide](references/style.md): the shared writing standard and language-specific examples; read for every documentation task. It can also be used independently.
- [Evaluation cases](evals/cases.md): isolated Chinese and English tasks, fixtures, and checks; use when evaluating or changing this skill, not during routine documentation work.
