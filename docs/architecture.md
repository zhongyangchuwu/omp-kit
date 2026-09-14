# Architecture

OMP Kit is a thin workflow/product layer on top of Oh My Pi. The design goal is the smallest external structure that reliably improves real work without duplicating OMP runtime responsibilities.

## Ownership

```text
OMP owns
  plugin/package discovery
  model/provider selection
  task/subagent lifecycle
  tool/capability enforcement
  session persistence and stable subagent artifacts
  stats / trace / RPC / generic observability
  ordinary user settings and profiles

OMP Kit owns
  model-neutral task agents
  repository workflow and project-state policy
  bounded worker/review procedures
  structured qualitative feedback
  compact derived dogfood summaries
```

Prefer OMP public behavior, then public RPC/stats/package APIs, then a small local implementation only for semantics that genuinely belong to omp-kit.

## Core package

The v0.1.0 core exposes:

```text
agents/
  luna-code
  luna-deep
  luna-doc
  sol-review

skills/
  omp-workflow
  git-workflow
  bounded-executor
  omp-review

rules/
  omp-kit-workflow.md        # Main only

extensions/
  feedback.ts

scripts/
  session_evidence.ts
```

Core resources are default-discovered because they live under the plugin package root. OMP Kit does not maintain a second generated registry for them.

## Capability layers

### Core

Required for the current omp-kit identity or directly required by a core agent/workflow. Lives in this repository's OMP-discovered roots and receives the core release cadence.

### Companion

Optional first-party workflow capability. It must be useful independently and must not be required by core. When maintained, package it separately and install it explicitly rather than placing it under the core `skills/` root.

Examples of capabilities deliberately excluded from the v0 core include generic debugging, research, testing, product-design, programming-language and Skill-authoring guidance, plus specialized `.planning` artifacts.

### Integration

External service/provider/MCP capability with separate dependencies, credentials, billing, network access or risk. Integrations should have an explicit install boundary and independent lifecycle. AutoDL management and document parsing are examples removed from the core release.

Core never depends on Companion or Integration layers.

## Skill / extension / CLI / MCP choice

Use the smallest mechanism that owns the behavior:

- **Skill** — reusable judgment/workflow instructions.
- **Extension/custom tool** — typed OMP runtime capability or lifecycle hook.
- **CLI** — deterministic local implementation that benefits from direct testing.
- **MCP** — cross-process/cross-client integration where a standard external tool boundary is itself valuable.

Do not introduce MCP merely to wrap a local OMP-specific function. Conversely, service-specific credentials or long-running external state do not belong in the core Skill layer.

## Agents and delegation

Task agents are model-neutral. Runtime/user configuration selects concrete models. `luna-code`, `luna-deep` and `luna-doc` autoload `bounded-executor`; `sol-review` autoloads `omp-review`.

Workers execute only their assigned scope and do not create another orchestration layer. Main owns high-context judgment, integration, acceptance and remote mutation. Independent review is selected by risk and ambiguity rather than being a mandatory stage after every edit.

## Project state

The default durable structure is issue-centered:

```text
actual repository/runtime state
-> current docs/executable policy
-> docs/WORKING_STATE.md as a short index
-> open Issues for unfinished work
-> PRs/Actions for implementation and verification
-> Git + Issue/PR history for chronology
```

Do not duplicate chronology into an archive directory. Rich phase/planning dossiers are not part of the core v0 surface; they can return as a companion only if later dogfood shows a concrete need.

## Feedback and evidence

`omp_kit_feedback` is qualitative evidence, not an authority or self-modification channel. It records supported session/file provenance rather than guessing caller identity that OMP does not expose.

OMP remains the raw session recorder. `session_evidence.ts` derives compact summaries through public OMP stats/session surfaces and keeps them outside Git. Counters never automatically decide routing quality or policy changes.

## Verification boundary

Repository CI proves deterministic contracts in the checked-in tree. Released-runtime claims require the relevant real OMP smoke. External state requires read-back appropriate to that state. Do not promote a test pass into a stronger claim than the test actually establishes.
