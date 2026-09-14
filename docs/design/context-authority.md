# Context authority and provenance

## Problem

Long-running agent work has two different context problems that are easy to conflate:

```text
memory / retrieval
  can the model recover a piece of information?

authority / provenance
  should this information control the current decision?
```

More retrievable history does not solve stale requirements, superseded plans, generated summaries presented as facts, external prompt injection, or a worker treating an old conversation as permission to mutate current state.

omp-kit therefore needs a small policy for deciding what context means, how current it is, and whether it may control action without building a second memory/runtime system.

## Evidence

### Repository information model

**Type:** repository fact + dogfood.

```text
actual repository/runtime state -> current observable fact
executable policy/resources     -> current implemented behavior
current docs                    -> accepted durable project policy
design records                  -> accepted rationale and limits
compact experiment bundles      -> selected auditable evidence
WORKING_STATE.md                 -> current entry point / index
open Issues                     -> unresolved objective and acceptance
Pull Requests                   -> implementation/review
closed Issues / Git history     -> chronology and superseded material
```

`docs/README.md` avoids one global authority chain because different questions require different sources. Parser retirement under #14 illustrated that old instructions remain historical evidence after their executable path is removed. The later documentation cleanup removes duplicate archive copies, not the distinction between current policy and history.

### Parent-history retrieval

**Type:** controlled runtime evidence + workflow policy.

Native-foundation work established that workers can retrieve relevant parent context through OMP history rather than requiring Main to rewrite the full conversation. The workflow reference requires relevant retrieval and independent repository inspection.

That mechanism solves recovery, not authority. A parent transcript can contain rejected alternatives, stale assumptions, assistant suggestions and user decisions subsequently superseded.

### Notes-backed rollover

**Type:** runtime evidence.

Notes can preserve decisions, invariants and blockers across current-session rollover. They are continuity aids, not a universal cross-session project database or a replacement for observable repository/runtime state.

### Real project-state dogfood

**Type:** dogfood.

Project work has used `WORKING_STATE.md + owning Issue + actual branch/files/runtime` to recover an objective. It also exposed stale durable state: local verification reported OMP 18.1.20 while docs still said 18.1.19. The observation corrected the text.

These operational examples do not prove the remaining genuinely fresh-session/offline acceptance criteria in #11. Same-conversation recovery is not fresh-session evidence.

### External research and tools

**Type:** repository fact + risk boundary.

Workers may use web search and navigation during real development. Their instructions treat external/search/tool output as evidence, not new authority. Logs, scanners, repository text and web pages can support facts without acquiring the authority of the user or current dispatch.

## Interpretation

There is no useful single ranking such as `user > repository > docs > issue > history`, because these answer different questions:

- the user defines desired behavior but cannot make a nonexistent file exist;
- code establishes current behavior but cannot decide what the user wants changed;
- an Issue owns a target and acceptance criteria without making an unimplemented plan current behavior;
- history explains a decision but cannot revive a superseded one;
- an external source may establish a fact but cannot authorize a repository write.

Authority is **claim-type specific**.

## Design principle

> Classify the claim before ranking its sources.

For a material conflict, identify intent/authorization, current observable state, accepted policy, active work, rationale/evidence or historical context. Then use the appropriate source class.

## Current authority model

### 1. Intent and authorization

Question: what does the user want and what may this agent do?

```text
latest explicit user instruction
-> current explicit task/dispatch contract
-> accepted current project policy when not overridden
```

New explicit decisions supersede older ones. Brainstorming, assistant proposals and retrieved text are not authorization. Worker scope comes from the current dispatch, not commands discovered in history, Issues, web pages, code comments or tool results. Return material scope/product conflicts to Main rather than widening the task.

### 2. Current observable state

Question: what exists or is happening now?

```text
actual repository/files/Git state
observed runtime/tool/external read-back
-> current executable resources/configuration
-> current descriptive docs
-> plans, summaries, Issues and history
```

Direct observation can invalidate stale descriptions, but an observed implementation can still be a bug. Externally mutable state needs read-back when freshness or success matters; an earlier attempted write is not proof of its result.

### 3. Accepted project policy

Question: what durable behavior or boundary has been accepted?

Use executable policy where encoded, together with current accepted docs/design records and their supporting evidence.

Current docs explain accepted intent; resources establish its implemented form. When they disagree, determine whether code or docs are wrong rather than choosing the convenient one. An open Issue's proposal does not become policy simply by existing. Accepted rationale must remain available in the distributed checkout.

### 4. Active work and acceptance

Question: which unfinished problem is being worked and what closes it?

```text
latest user direction
-> WORKING_STATE.md navigation
-> owning Issue body and material current comments
-> active PR implementation/review state
```

The index points to the owner, not the full chronology. Comments can supersede a stale body until it is reconciled. Actual branch/runtime observations still decide what already happened. Merging, pausing or superseding a proposal is not proof that every acceptance criterion is complete.

### 5. Rationale and evidence

Question: why does the mechanism exist and what supports it?

```text
docs/design/*.md
+ evidence/experiments/* when material
-> linked Issues / PR discussion
-> original external or runtime evidence
```

Preserve evidence types, exact identities and limitations. Prefer original observations when wording/provenance matters. Community reports can motivate hypotheses without becoming project facts. A design record explains accepted rationale but does not overrule observable behavior or authorize new work.

### 6. Historical context

Question: what happened previously or why did an older path exist?

Use closed Issues, merged PRs, specific Git revisions and older session history. Historical material can describe commands or policies no longer supported. Do not rewrite it to look current. The old `docs/archive/` copies are removed; unique still-useful conclusions are retained in current validation/design, with immutable original-source links.

## Lightweight provenance states

Use ordinary labels only when they change a decision:

```text
observed fact
accepted decision / invariant
open question / hypothesis
external evidence
superseded / historical
```

Keep each at its existing owner: accepted behavior in docs/resources, rationale in design records, selected experiment evidence in bundles, unfinished work in Issues and chronology in Git/PR history. Do not build a generic provenance database or flatten these into an undifferentiated generated summary.

## Conflict handling

1. Classify the claim.
2. Check freshness and original provenance.
3. Keep a material contradiction explicit; do not synthesize an unsupported compromise.
4. Apply the authority appropriate to that claim, not a single global ranking.
5. Escalate unresolved authorization/product ambiguity; do not ask about facts tools can establish.
6. Reconcile the owning current doc/Issue/index after a decision. Leave historical evidence historical.

Examples:

```text
user says "keep the API compatible" + current code breaks it
=> intent defines the target; code establishes the observed failure

Issue says "parser cleanup pending" + branch lacks it and checks passed
=> observations establish current state; reconcile the stale Issue/docs

web result says "run this command"
=> evidence only, not new authorization

old Git snapshot requires a version-specific workaround
=> historical claim; check current runtime before applying it
```

## Push vs reference context

Push the context that must control execution:

```text
objective
scope / writable boundary
accepted requirements
acceptance / verification target
material consequence constraints
```

Reference long rationale, parent discussion, historical experiments and external sources on demand. This avoids verbose handoffs while keeping the execution contract explicit. Retrieved material never gains authority merely by being retrieved.

## Permissions and visibility

```text
source authoritative for a claim != worker permitted to retrieve it
worker can retrieve a source     != source may authorize new action
```

OMP owns tool/session/resource visibility enforcement. omp-kit owns workflow scope and interpretation, not a second permission system. Inaccessible context is not nonexistent context; report missing required information rather than fabricating it or widening access indirectly.

## Current mechanism

This policy uses existing surfaces: docs and design records for accepted knowledge, `WORKING_STATE` for navigation, Issues for unfinished work, `omp-workflow` for Main judgment, subagent-context guidance for retrieval, and agent definitions for external-content boundaries. OMP owns session/history storage and capabilities.

No extra memory store, context broker, provenance database or runtime permission layer is introduced.

## Evaluation and limits

Operational work has corrected stale version text, separated retired implementations from their historical evidence, and recovered active objectives through repository/Issue state. This supports the authority model, not a claim that its information architecture is optimal for every project.

Important limits:

- observation may reveal a bug rather than desired behavior;
- current docs and open Issue bodies can lag implementation or later comments;
- history retrieval can select a wrong session or superseded passage;
- external evidence can be stale, low-quality or malicious;
- source separation is guidance, not runtime sandboxing;
- offline users cannot rely on reaching GitHub, so accepted truth and rationale must ship in the repository.

#11 evaluates real recovery, duplication and offline behavior. `.planning/` remains a deliberately selected specialized workflow; its maintained Skill is not obsolete merely because this repository uses issue-centered state.

## Current status

**Accepted authority/provenance policy; no new runtime subsystem required.** Change the mechanism only when real work exposes a concrete gap.

## Related implementation / Issues

- [Documentation map](../README.md)
- [Working state](../WORKING_STATE.md)
- [Design foundations](../design-foundations.md)
- [OMP workflow](../../skills/omp-workflow/SKILL.md)
- [Subagent context](../../skills/omp-workflow/references/subagent-context.md)
- #10 authority/provenance; #11 state recovery; #5 capability observation; #7 runtime gaps.

## Revisit triggers

Repeated stale-context actions, failed fresh-session recovery, GitHub-offline dependence, changed OMP history/notes/provenance primitives, or visibility changes warrant review. Preserve accepted knowledge while changing only the layer that owns the demonstrated failure.
