# Documentation map

The checkout contains current product knowledge, accepted design rationale and compact decision evidence. Issues coordinate unfinished work; they are not a replacement for distributed documentation.

## Read by purpose

| Question | Owner |
| --- | --- |
| What is this and how do I start? | [Repository README](../README.md), [installation](omp-installation.md) |
| What is installed and who owns configuration? | [Architecture](architecture.md), [configuration](omp-configuration.md) |
| How do I use and maintain it? | [Workflows](workflows.md), [Skill design](skill-design.md) |
| Why is it designed this way? | [Design foundations](design-foundations.md), [design records](design/README.md) |
| What has been tested, and what has not? | [Validation](VALIDATION.md), [OMP compatibility](omp-compatibility.md) |
| How are real sessions collected and analyzed? | [Session evidence](session-evidence.md) |
| How are sessions reviewed for human attention? | [Session assurance](session-assurance.md), [observed scope](assurance-scope.md) |
| Which observations justify a decision? | [Experiment lifecycle](experiments.md), [compact evidence bundles](../evidence/README.md) |
| Which runtime primitive should an integration use? | [Runtime notes](omp-runtime-notes.md) |
| Which unfinished problem owns this task? | The relevant open Issue / active PR when one exists |

## Information ownership

Different claims need different sources. Current code/runtime observations establish what exists; explicit user instructions establish intent and authorization. Current docs and executable policy describe accepted behavior. Design records explain its rationale and limitations. See [context authority](design/context-authority.md).

```text
accepted behavior and decisions -> current docs / executable resources
accepted mechanism rationale    -> docs/design/
selected decision evidence      -> evidence/experiments/
raw sessions / routine summaries -> OMP / local evidence store outside Git
unfinished concrete problem     -> open Issue
implementation / review / CI    -> PR and Actions
superseded chronology           -> Git and Issue/PR history
```

One Issue owns one independently decidable problem, not a roadmap. Projects may be only partially planned, and no complete global Issue index is required before work begins. Keep unfinished work open; active/inactive labels only indicate attention. Close only when acceptance criteria are complete. When a decision is accepted, update the owning repository doc rather than leaving the only explanation in comments.

## Design and evidence are maintained assets

A design document is not obsolete merely because its decision is settled. A compact experiment remains useful when its method, revision, outcomes and limits support a decision or enable later reinterpretation. Preserve exact identities and mark corrections explicitly. Do not silently rewrite an old measurement to match current policy.

Routine sessions are not formal experiments. Keep raw transcripts, logs and broad telemetry outside Git; promote only selected compact evidence when it supports a material conclusion. Do not require a new experiment, validator or artifact backend solely to fill a template.

## Keep the current tree navigable

- Keep the README for onboarding, architecture for current structure, and design records for why.
- Do not add a mutable global work-state mirror solely to list Issues/PRs; recover task-local coordination context on demand.
- Remove duplicate archive copies and old handoff/roadmap chronology after preserving any unique accepted conclusion or useful evidence.
- Link a specific Git revision when a retired implementation or historical report is the original source.
- Review maintained Skills by correctness, duplication and practical value, not by whether they are tightly coupled to omp-kit.
- Resource categories describe responsibility; they do not automatically change discovery, installation or permission.

The former `docs/archive/` is removed. Its source remains in Git; current conclusions and retained experiment bundles remain readable in this checkout.
