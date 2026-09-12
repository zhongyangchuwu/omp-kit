# OMP Harness v2 Guide

## Purpose

`omp-kit` should evolve from an OMP-first skill collection into a maintained personal multi-model harness for Oh My Pi. The new center of gravity is not only reusable skills. It is the combination of:

- runtime orchestration policy;
- model and reasoning-effort routing;
- specialized worker agents;
- context management;
- task-specific skills;
- observability and quota-aware iteration;
- reproducible installation of OMP configuration.

The existing skill lifecycle, provenance, registry, validation, and reference-management machinery remains valuable and should be preserved where it still fits. The change is primarily architectural: skills become one layer in a larger harness rather than the whole product.

## Core design principles

### 1. Separate control plane from workforce

Use a strong model for high-leverage decisions and inexpensive models for token-heavy execution.

Target conceptual topology:

```text
Human
  |
  v
Sol main director
  |
  +-- intent interpretation
  +-- ambiguity resolution
  +-- decomposition and routing
  +-- integration decisions
  +-- high-risk review
  |
  +----------------------------+
  |                            |
  v                            v
Luna High                    Luna Max
routine execution            difficult bounded execution
```

Current preferred role philosophy:

- `default`: Sol Medium
- routine implementation/exploration: Luna High
- difficult implementation: Luna Max
- mechanical/background tasks: Luna Low/Medium
- planning/high-risk reasoning: Sol High where justified
- final/high-risk review: Sol High
- Sol Max: exceptional escalation only
- Terra: no required default role; keep available as an escape hatch if a real workload niche appears

Do not encode model names into task procedures when a role abstraction is sufficient. Keep policy and model mapping separate.

### 2. Director sends intent and boundaries; workers retrieve context

Avoid making the expensive director repeatedly restate long conversation context.

When a delegated task depends on the current discussion, a worker should retrieve the parent transcript itself through `history://Main` (or the actual parent agent id), rather than receiving a rewritten multi-thousand-token brief.

A short dispatch should normally provide:

- the immediate objective;
- scope/boundaries;
- where authoritative context lives;
- acceptance or stop conditions when needed.

Example:

```text
Update docs/architecture.md to reflect the decisions from the current discussion.
Read history://Main first, then read the existing document.
Treat explicit user decisions as authoritative.
Do not turn exploratory ideas or unresolved questions into requirements.
Stop when the accepted design is represented without contradicting retained guidance.
```

Conversation is evidence, not automatically a specification.

Authority order for interpreting parent context:

1. latest explicit user decisions and requirements;
2. earlier explicit user decisions not superseded later;
3. assistant/director conclusions explicitly accepted by the user;
4. repository facts and durable project rules;
5. tentative suggestions, brainstorms, alternatives, and unresolved discussion.

If a material product or architecture decision is still unresolved after reading the parent transcript, return the ambiguity to the director instead of guessing.

### 3. Prefer pull-based context over inherited context

Do not automatically copy the entire parent conversation into every worker.

Use three context levels:

- **Direct**: small, explicit task; worker needs no parent transcript.
- **Referenced**: task depends on recent discussion; worker reads `history://Main` once at startup.
- **Explicit contract**: high-risk or ambiguous work; director sends objective/scope/acceptance criteria and parent history is supporting evidence only.

Persistent workers should reuse their own transcript. Do not repeatedly reread parent history unless an important new decision has been made.

### 4. Match worker harness complexity to task complexity

Small/medium models can be harmed by a large action space, long generic prompts, and irrelevant tools. Prefer specialized workers with restricted tools instead of letting every worker inherit the full OMP capability surface.

Suggested initial custom agents:

```text
luna-code      Luna High   normal scoped implementation
luna-deep      Luna Max    difficult bounded implementation/debugging
luna-doc       Luna Max    documentation/config synthesis from discussion
sol-review     Sol High    high-risk/final review
```

Possible later agent:

```text
context-curator  Luna High/Max  maintain context notes or durable summaries
```

Suggested small tool surfaces:

`luna-code`:

```text
read, grep, glob, edit, bash, hub, yield
```

`luna-doc`:

```text
read, grep, edit, write, hub, yield
```

Only add web, MCP, subagent spawning, eval, or other tools when the task shape actually requires them.

OMP custom task agents support independent `model`, `thinking-level`, `tools`, `spawns`, `autoloadSkills`, `read-summarize`, `prewalk`, and `advisor` settings. Use these rather than relying on bundled `/vibe` agents when greater control is useful.

### 5. Build a custom persistent-worker workflow instead of depending on `/vibe`

Bundled `/vibe` is useful as a reference implementation, but it hard-maps `fast -> sonic` and `good -> task`, and those bundled agents currently run with a relatively full OMP child harness.

For `omp-kit`, prefer ordinary persistent task agents plus hub-based coordination:

```text
omp-workflow skill
   |
   +-- choose agent
   +-- spawn task agent
   +-- wait asynchronously or continue other work
   +-- steer/reuse the same persistent worker through hub
   +-- escalate only when evidence shows the current tier is insufficient
```

The desired conceptual mapping is:

```text
custom task spawn  ~ vibe_spawn
hub message        ~ vibe_send
async completion   ~ vibe_wait/result delivery
persistent agent   ~ vibe worker session
```

Do not recreate `/vibe` UI semantics unless they are genuinely useful. Reuse OMP task-agent persistence and hub infrastructure.

### 6. Bounded workers, not open-ended workers

High reasoning effort should not imply unlimited autonomous loops.

A bounded execution skill should define:

- strict scope discipline;
- targeted repository exploration;
- no speculative cleanup/refactoring;
- narrow verification first;
- no repeated passing tests without new evidence;
- after two materially different failed repair attempts on the same blocker, stop and report;
- stop immediately once acceptance criteria and relevant verification are satisfied.

A worker that stops should return:

- what changed;
- verification performed;
- blocker/risk if any;
- evidence useful to the director.

### 7. Human decision boundary

Agents should not convert unresolved product preferences into implementation decisions.

Return to the user/director when a decision:

- changes externally visible behavior without a clear requirement;
- commits to an expensive-to-reverse architecture;
- represents materially different UX/product tradeoffs;
- risks destructive or irreversible data changes;
- depends primarily on user preference instead of technical correctness.

Do not ask the user for ordinary implementation details that can safely be inferred from repository conventions.

### 8. Separate routine verification from strong review

Routine worker completion should normally be:

```text
worker targeted verification
  -> director checks critical evidence/interfaces
  -> done
```

Do not invoke an independent strong reviewer for every small change.

Use Sol review when failure cost is elevated, including:

- security/auth/authz;
- persistence/schema/migrations;
- concurrency/distributed state;
- public APIs/protocols;
- large architectural refactors;
- subtle correctness fixes;
- changes spanning interacting subsystems;
- workstreams that required repeated repair/escalation.

Reviewers should normally be read-only; fixes go back to a worker unless the task explicitly says otherwise.

## Context management strategy

### Legacy compaction

OMP currently supports an ordered automatic compaction chain:

```text
remote -> snapcompact -> handoff -> shake -> soft
```

For this harness, a simpler initial fallback is preferable:

```yaml
compaction:
  enabled: true
  methodOrder:
    - shake
    - soft
  asyncEnabled: false
  keepRecentTokens: 20000
```

Rationale:

- `shake`: local mechanical removal of recoverable heavy content; no LLM call.
- `soft`: semantic summary using a compaction model when mechanical reduction is insufficient.
- `handoff`: better treated as an explicit phase/session boundary artifact than a routine first-line compressor.
- `snapcompact`: interesting and potentially efficient, but should be evaluated independently before becoming a default.
- `remote`: provider-native behavior is route-dependent; keep as an optional experiment rather than a harness assumption.

Once compaction behavior and quota impact are understood, consider turning speculative `asyncEnabled` back on.

### Compaction model

`compactionModel` is model metadata in `models.yml`, not a normal role mapping in `config.yml`.

For a strong main model, route local soft compaction to Luna so Sol does not spend tokens rewriting history.

Conceptual example:

```yaml
providers:
  cpa:
    modelOverrides:
      gpt-5.6-sol:
        compactionModel: cpa/gpt-5.6-luna
```

Important current limitation: OMP selects a different compaction model, but the compaction call inherits the main session thinking level. There is not currently an independent `compaction.thinkingLevel` setting. Therefore `Sol Medium -> Luna compactionModel` should be expected to use Luna at roughly the inherited medium effort, not an independently chosen Luna High. Treat independent compaction effort as a possible future OMP feature if measurements show it matters.

### Notes-backed context windows

The experimental Notes-backed mode is highly relevant to this harness:

```yaml
compaction:
  experimentalContextManagement: true
```

Restart after enabling so the tool roster refreshes.

It introduces:

- `context_notes`: persistent notebook injected into the active context;
- `new_context`: roll to a new context window at a safe boundary without a summarization model;
- `history://current/full`: recover raw historical messages/tool outputs for the current session via `read`/`grep`.

This changes the mental model from repeated lossy summaries to:

```text
persistent working notes
+ recent verbatim context
+ searchable archived transcript
```

This is likely a better fit for a long-lived Sol director.

Caveats:

- notebook quality and update timing remain the model's responsibility;
- notes are limited to 16,384 UTF-8 bytes per replacement;
- `history://current/full` belongs to the calling session only;
- workers can still read the concise parent transcript through `history://<agent-id>`, but cannot automatically read the parent's raw `history://current/full` archive;
- restricted sessions lacking `context_notes`, `new_context`, `read`, and `grep` fall back to legacy maintenance.

Recommended first experiment:

- enable Notes-backed context on the main Sol session;
- keep restricted Luna workers simple;
- let workers read `history://Main` when parent discussion matters;
- retain `shake -> soft` as the legacy/fallback policy for sessions that do not use Notes-backed management.

## Repository-managed OMP configuration

Stop manually maintaining live OMP configuration as the source of truth. `omp-kit` should own versioned canonical configuration and install/sync it into `~/.omp/agent`.

Recommended repository structure:

```text
omp-kit/
├── config/
│   ├── config.yml
│   └── models.yml
├── agents/
│   ├── luna-code.md
│   ├── luna-deep.md
│   ├── luna-doc.md
│   └── sol-review.md
├── skills/
│   ├── omp-workflow/
│   ├── bounded-executor/
│   └── ...
├── docs/
│   ├── HARNESS_V2_GUIDE.md
│   └── ...
├── scripts/
│   ├── install.sh
│   ├── validate.sh
│   └── ...
└── README.md
```

The exact directory names can follow existing repository conventions; do not restructure blindly. Preserve the current resource lifecycle and metadata machinery where possible.

### Configuration management rules

- Repository files are canonical.
- Live `~/.omp/agent/config.yml`, `models.yml`, `agents/`, and selected skills should be generated/symlinked/copied from the repository by a documented install path.
- Do not commit API keys, OAuth credentials, cookies, account identifiers, machine-specific secrets, or sensitive absolute paths.
- Prefer environment variables, OMP auth storage, or command-resolved secret references for credentials.
- Keep machine-specific overrides separate from portable canonical defaults.
- Installation should be idempotent and should make destructive replacement explicit.
- Existing user configuration should be backed up or diffed before replacement unless the user explicitly chooses force mode.
- Validation should check YAML syntax, required directories/resources, agent frontmatter, referenced skills/model roles, and absence of obvious secrets.

A useful eventual split may be:

```text
config/config.yml          portable tracked defaults
config/models.yml          tracked model/provider metadata without secrets
config/local.example.yml   optional example only
~/.omp/agent/...           deployed runtime state
```

Do not invent a separate templating system unless real machine-specific variation requires one.

## Skill boundaries

`APPEND_SYSTEM.md` should not become the main repository architecture document. Treat it as a last-mile runtime patch layer for universal rules that must override OMP defaults.

Prefer:

```text
omp-workflow
  -> orchestration, routing, worker lifecycle, context policy

bounded-executor
  -> how implementation workers execute and stop

omp-review
  -> review method and findings discipline

project rules / AGENTS.md
  -> repository-specific facts and constraints

config.yml / models.yml
  -> model routing and runtime configuration
```

Within `omp-workflow`, consider separating references:

```text
references/
  delegation.md
  subagent-context.md
  execution.md
  phase-lifecycle.md
  ...
```

`subagent-context.md` should define Direct / Referenced / Explicit-contract context transfer and transcript authority rules.

`delegation.md` should define worker selection, persistence/reuse, escalation, concurrency, and duplicate-work avoidance.

The existing `.planning/` style durable artifacts should be used when state must survive across sessions/people, not merely because a task is large. A substantial feature completed in one session may need no durable planning package; a multi-week project with important decisions usually does.

## First implementation sequence

Do not attempt a large rewrite in one pass. Suggested order:

1. Inspect existing repository conventions, install scripts, validation, registry, and active skills.
2. Add tracked canonical OMP `config.yml` and `models.yml` without secrets.
3. Extend installation/validation so configuration and agents are managed reproducibly.
4. Add `luna-code`, `luna-deep`, `luna-doc`, and `sol-review` custom agents with deliberately small tool surfaces.
5. Add or refactor `bounded-executor` guidance.
6. Refactor `omp-workflow` references to separate delegation and subagent-context policy.
7. Add Notes-backed main-session configuration as an opt-in/experimental default only after checking compatibility with the user's installed OMP version.
8. Preserve legacy compaction fallback (`shake -> soft`) and document `compactionModel` in `models.yml`.
9. Update README/architecture docs only after the actual implementation shape is known.
10. Validate/install locally, inspect effective OMP configuration, and run real A/B tasks before deleting older mechanisms.

## Evaluation plan

Do not judge the harness only by token cost per request. Measure completed useful work per human hour and per quota window.

For worker experiments record:

- task success / acceptance achieved;
- number of provider requests;
- input/output/cache tokens;
- retries and materially different repair attempts;
- escalations;
- wall-clock time;
- human interventions;
- duplicate director/worker exploration;
- tool-call count and tool-selection errors;
- final review findings.

High-value A/B comparisons:

1. bundled Vibe Luna vs custom minimal-tool Luna;
2. Luna High vs Luna Max on the same bounded task class;
3. parent-written long brief vs short intent + `history://Main` retrieval;
4. legacy soft compaction vs Notes-backed main context;
5. routine director verification vs independent Sol review on high-risk changes.

The goal is not a theoretically elegant harness. The goal is a harness that completes more reliable work with less human attention and less expensive-model usage.
