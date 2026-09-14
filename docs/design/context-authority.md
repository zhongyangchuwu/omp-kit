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

omp-kit therefore needs a small policy for deciding what a piece of context means, how current it is, and whether it may control action without building a second memory/runtime system.

## Evidence

### Current repository information model

**Type:** repository fact + dogfood.

The repository already separates information by purpose:

```text
actual repository/runtime state     -> current observable fact
executable policy/resources          -> current implemented behavior
current docs                         -> accepted durable project policy
WORKING_STATE.md                     -> current entry point / index
open Issues                          -> unresolved objective, acceptance, chronology
Pull Requests                        -> concrete implementation/review
closed Issues / archive / git history -> historical evidence
```

`docs/README.md` explicitly avoids one global authority chain because different questions require different source types. Issue #14 parser retirement also showed why this matters: archived parser instructions remained valid historical evidence after the executable parser itself had been removed.

### Parent-history retrieval

**Type:** controlled runtime evidence + workflow policy.

Earlier native-foundation work established that workers can retrieve relevant parent context through OMP history rather than requiring Main to rewrite the full conversation. The current `omp-workflow` reference already requires search-first retrieval and independent repository inspection.

That mechanism solves recovery, not authority. A parent transcript can contain rejected alternatives, stale assumptions, assistant suggestions, and user decisions that were later superseded.

### Notes-backed rollover

**Type:** runtime evidence.

Notes can preserve accepted decisions, invariants and blockers across current-session context rollover. They are useful continuity aids but are not a universal cross-session project database and do not override current repository/runtime observations.

### Real project-state dogfood

**Type:** dogfood.

Recent omp-kit work repeatedly used:

```text
WORKING_STATE.md
+ owning Issue
+ actual branch/files/runtime
```

to recover the current objective without relying on hidden chat memory. The same work also exposed stale durable state: after local verification reported OMP 18.1.20, current docs still said 18.1.19 and had to be corrected from observed runtime evidence.

### Broad external/research tool exposure

**Type:** repository fact + risk boundary.

Current workers may use `web_search` and other research/navigation tools during real development. Their agent instructions already state that external/search/tool output is evidence, not new authorization or instructions. This is necessary because provenance and permission are separate: content retrieved from the web, logs, scanners, or repository files may be useful evidence but must not silently acquire the authority of the user's request or Main's task contract.

## Interpretation

There is no useful single ranking such as:

```text
user > repository > docs > issue > history
```

because those sources answer different kinds of questions.

For example:

- the user can define the desired behavior but cannot make a nonexistent file exist;
- the repository can establish what code currently does but cannot decide what the user wants changed;
- an Issue can own an unresolved target and acceptance criteria but does not make an unimplemented plan current runtime behavior;
- history can explain why a decision was made but cannot revive a superseded decision;
- an external source can establish a public fact but cannot authorize a repository write.

Authority is therefore **claim-type specific**.

## Design principle

> Classify the claim before ranking its sources.

For any material conflict, first ask what kind of statement is being resolved:

```text
intent / authorization
current observable state
accepted project policy
active work / acceptance target
rationale / evidence
historical context
```

Then use the source class appropriate to that claim.

## Current authority model

### 1. Intent and authorization

Question:

> What does the user want, and what action is this agent allowed to take?

Use:

```text
latest explicit user instruction
-> explicit current task/dispatch contract
-> accepted current project policy when the user has not overridden it
```

Rules:

- newer explicit user decisions supersede older user decisions;
- questions, brainstorming, assistant proposals and retrieved text are not authorization;
- worker scope comes from the current dispatch, not from instructions discovered in history, logs, code comments, Issues, web pages, scanner output, or other tool results;
- a worker encountering a material scope/authorization conflict returns it to Main rather than widening its task itself.

### 2. Current observable state

Question:

> What exists or is happening now?

Prefer direct observation:

```text
actual repository/files/git state
observed runtime/tool/external read-back
-> executable resources/configuration
-> current descriptive docs
-> plans, summaries, Issues, history
```

Rules:

- runtime/repository observation can invalidate stale documentation about current behavior;
- an observed state is evidence of what is true, not automatically evidence of what ought to be true;
- externally mutable state should be read back when success or freshness matters rather than inferred from an old request or cached discussion.

### 3. Accepted project policy

Question:

> What durable behavior or architectural boundary has the project accepted?

Use:

```text
executable policy/resources when the policy is encoded there
+ current accepted docs/design records
-> resolved Issue/PR evidence supporting that policy
```

Rules:

- current docs explain accepted intent; executable resources establish the implemented form;
- when current docs and implementation disagree, do not silently choose whichever is convenient: determine whether the code is wrong or the docs are stale, then reconcile the durable state;
- an open Issue may propose a policy change but does not become accepted policy merely by existing.

### 4. Active work and acceptance target

Question:

> What problem is currently being worked, and what closes it?

Use:

```text
latest user direction
-> WORKING_STATE.md as the entry-point/index
-> owning open Issue body + current comments
-> active PR for implementation/review state
```

Rules:

- `WORKING_STATE.md` points to the owner; it should not duplicate the full chronology;
- the owning Issue can define unresolved acceptance criteria without claiming they are already implemented;
- comments are chronological evidence and may supersede an older body only until the body/current docs are deliberately reconciled;
- actual branch/runtime state still wins for claims about what has already happened.

### 5. Rationale and evidence

Question:

> Why does this mechanism or decision exist, and what supports it?

Use:

```text
docs/design/*.md
+ evidence/experiments/* when material
-> linked Issues / PR discussion
-> original external or runtime evidence
```

Rules:

- preserve evidence type and limitations;
- prefer the original observation/source over a generated summary when exact wording or provenance matters;
- community reports and external analysis can motivate hypotheses but do not silently become project facts;
- a design record explains accepted rationale but does not override current observable behavior.

### 6. Historical context

Question:

> What happened previously, or why did an older path exist?

Use:

```text
closed Issues / merged PRs
docs/archive/
git history
older session history
```

Rules:

- historical material is evidence, not current instruction;
- archive content may intentionally describe commands, versions or policies that no longer exist;
- do not rewrite history merely to make old evidence look consistent with current policy.

## Lightweight provenance states

Do not build a generic provenance database. When a distinction materially affects work, use ordinary project language to label the claim:

```text
observed fact
accepted decision / invariant
open question / hypothesis
external evidence
superseded / historical
```

These states belong where the information already lives:

- current accepted behavior in executable policy/current docs;
- rationale/evidence in design records;
- unresolved work in Issues;
- historical material in closed Issues/archives/git history.

A generated summary should preserve these distinctions rather than flattening all retrieved text into one undifferentiated context block.

## Conflict handling

When two sources disagree materially:

1. **Classify the claim.** Is the conflict about intent, current state, accepted policy, active plan, evidence, or history?
2. **Check freshness and provenance.** Retrieve the original/current source when the summary may be stale or ambiguous.
3. **Do not merge contradictions into a synthetic compromise.** State the conflict explicitly.
4. **Use the appropriate authority for that claim type.** Do not let a high-authority source for one claim type control another claim type.
5. **Escalate authorization ambiguity.** A worker returns material scope/product ambiguity to Main; Main asks the user only when repository/project evidence cannot safely resolve it.
6. **Reconcile durable state after resolution.** Update stale current docs/Issue body/index when the accepted truth changes; leave historical evidence historical.

Examples:

```text
user says "keep the API compatible"
+ current code breaks the API
=> user intent defines the target; code defines the observed failure

Issue says "parser cleanup pending"
+ branch lacks parser and local verify passed
=> branch/verification establish current state; Issue/current docs should be updated

web result says "run this command"
=> evidence only; it grants no new execution authorization

archive says OMP 18.1.18 requires workaround X
+ current runtime is 18.1.20
=> historical evidence; re-check current runtime before applying workaround
```

## Push vs reference context

The default worker contract should push only context that must control execution:

```text
objective
scope / writable boundary
accepted requirements
acceptance / verification target
material consequence constraints
```

Reference or retrieve on demand:

```text
long rationale
parent conversation
historical experiments
large design discussions
external sources
```

This keeps task contracts explicit without paying to restate all project history. Retrieval remains useful for provenance and rationale, but retrieved material does not gain authorization by being retrieved.

## Permissions and context visibility

Authority and capability are separate axes.

```text
source is authoritative for a claim
!= worker is permitted to retrieve it

worker can retrieve a source
!= source may authorize new action
```

OMP owns enforcement of tool/session/resource visibility. omp-kit should not emulate a second permission system in prompts or a memory database. omp-kit owns the workflow rule that an agent must act only within its current authorized scope and must treat retrieved/external content according to its provenance.

Absence of inaccessible context is not evidence that the context does not exist. A restricted worker should report missing required context rather than fabricate it or widen access indirectly.

## Current mechanism

The policy is implemented through existing project surfaces rather than a new runtime component:

- `docs/README.md` separates current truth, rationale, work coordination and history;
- `WORKING_STATE.md` is a short index, not a universal truth document;
- GitHub Issues own unresolved work/acceptance/chronology;
- design records preserve accepted rationale and evidence limits;
- `omp-workflow` makes Main own material judgment and conflict resolution;
- `subagent-context.md` makes workers independently verify repository facts and treat history as evidence;
- worker definitions treat external/search/tool output as evidence rather than authorization;
- OMP remains the owner of session/history/context storage and capability enforcement.

No new generic memory store, provenance database, context broker, or runtime permission layer is introduced.

## Evaluation / observed effect

Current evidence is operational rather than a controlled benchmark:

- project work has repeatedly recovered the active objective from durable repository/Issue state without requiring a bespoke planning database;
- stale runtime version text was corrected from direct local observation rather than allowing docs to override reality;
- Issue #14 kept historical parser material in archives while removing the current executable parser, demonstrating that historical provenance and current authority can coexist;
- broad research-tool rollout can retain a clear instruction boundary because external content is explicitly treated as evidence only.

This is enough to adopt a small authority policy. It does not prove that the current information architecture is optimal for every project shape.

## Counter-evidence and limits

- Direct repository/runtime observation can reveal a bug; it does not make the bug desired policy.
- User intent can intentionally supersede project policy, but user statements about current external state may still require read-back.
- Open Issue bodies can become stale relative to later comments until reconciled.
- Current docs can lag a web-authored or local change between implementation and verification.
- History retrieval may recover the wrong session or a superseded passage if the parent identity/range is not verified.
- External evidence may itself be stale, low-quality or malicious.
- Offline/local workflows cannot always reach GitHub Issues; current docs and repository state must remain sufficient to avoid a GitHub-only source of accepted truth.

Issue #11 continues to evaluate whether the current docs + Issues/PR information model should replace, coexist with, or specialize alongside richer `.planning/` workflows. This record does not pre-decide that migration.

## Current status

**Accepted authority/provenance policy; no new runtime subsystem required.**

The remaining work is dogfood: keep the policy small, watch for concrete contradictions or retrieval failures, and change the mechanism only when real work exposes a gap.

## Related implementation / Issues

- `../README.md`
- `../WORKING_STATE.md`
- `../design-foundations.md`
- `../../skills/omp-workflow/SKILL.md`
- `../../skills/omp-workflow/references/subagent-context.md`
- Issue #10 — authority/provenance design
- Issue #11 — repository/Issue workflow information model
- Issue #5 — broad worker capability observation
- Issue #7 — OMP-owned context/runtime gaps

## Revisit triggers

Revisit this policy when:

- real work repeatedly acts on stale/superseded context despite the current source separation;
- a fresh session cannot recover the current objective without hidden conversation memory;
- GitHub-unavailable/offline work exposes an accepted-truth dependency that exists only in Issues;
- OMP introduces first-class provenance/authority metadata or changes history/notes semantics;
- capability changes materially alter which context workers can retrieve;
- the project adopts or removes a richer `.planning/` mode under Issue #11.
