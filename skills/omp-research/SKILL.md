---
name: omp-research
description: Use when researching codebase behavior, libraries, frameworks, SDKs, APIs, technical options, spikes, or external sources before design or implementation; produces evidence, tradeoffs, confidence, and optional RESEARCH.md.
---

# OMP Research

## Focus

OMP Research owns evidence gathering for software decisions. It turns uncertainty into sourced findings, tradeoffs, confidence levels, and research records that planning or implementation can use.

## Activation

Use this skill when the task involves:

- codebase exploration before design or implementation;
- library, framework, SDK, API, CLI, or cloud service behavior;
- technical option comparison;
- a spike or feasibility check;
- current documentation or external source verification;
- package or dependency selection;
- uncertainty that affects architecture, implementation, verification, or risk.

## Workflow

1. State the research question and decision it supports.
2. Identify source types needed: codebase, official docs, package metadata, examples, issues, or runtime evidence.
3. Gather evidence with source-appropriate tools.
4. Compare options against the task constraints.
5. Assign confidence and name unresolved uncertainty.
6. Write findings in the requested response or `RESEARCH.md` when durable workflow state is used.

## Rules

- Treat unverified prior knowledge as a hypothesis.
- Prefer primary sources for external APIs and current library behavior.
- Use codebase evidence for project-specific behavior.
- Report contradictory or missing evidence directly.
- Separate findings, tradeoffs, recommendations, and assumptions.
- Keep research scoped to the decision being made.
- Do not turn research into implementation unless the user or workflow has entered execution.

## Support files

| Need | Load |
| --- | --- |
| Source confidence | `references/source-confidence.md` |
| Codebase research | `references/codebase-research.md` |
| External documentation research | `references/external-docs.md` |
| Research record shape | `references/research-record.md` |
