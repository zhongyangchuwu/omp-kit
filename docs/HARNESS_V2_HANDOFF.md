# OMP Harness v2 Handoff

## Goal

Evolve `zhongyangchuwu/omp-kit` from an OMP-first skill collection into a reproducible personal multi-model harness that manages:

- OMP `config.yml` and `models.yml` from the repository rather than by hand;
- specialized custom agents;
- skills and workflow guidance;
- long-context/context-management policy;
- model routing and reasoning effort;
- installation/validation of the live `~/.omp/agent` runtime;
- observability and experiments for quota/cost/reliability.

The immediate next task is to inspect the current repository and implement this direction incrementally, preserving useful existing infrastructure instead of replacing everything.

## Constraints & Preferences

- Do not treat the current repository structure or month-old harness philosophy as fixed; it is a starting point, not a target architecture.
- Preserve existing skill lifecycle/provenance/registry/validation machinery where it remains useful.
- Avoid putting all orchestration policy into `APPEND_SYSTEM.md`. Prefer maintainable skill/reference documents and custom agents. Treat `APPEND_SYSTEM.md` as a last-mile patch layer only if real runtime behavior requires it.
- Repository-managed configuration should become the source of truth. Avoid manual drift in `~/.omp/agent`.
- Never commit credentials, OAuth material, cookies, account identifiers, or other secrets.
- Keep model policy abstract where possible; model-role mappings belong in config rather than prose workflows.
- Current preferred model architecture is "Luna workforce + Sol control plane"; Terra should not be forced into a default role merely to preserve a three-tier hierarchy.
- Optimize for reliable completed work and low human intervention, not just token/request minimization.
- Smaller workers should use deliberately small tool surfaces when possible.
- A worker should pull parent context itself when useful instead of forcing the expensive director to restate a long discussion.
- Conversation history is evidence, not automatically a specification.
- Changes should be incremental and testable; do not rewrite the entire repository at once.

## Progress

### Done

- [x] Reviewed the current `omp-kit` at a high level: repository structure, README/AGENTS, architecture/runtime docs, active skills, and the existing `omp-workflow` model.
- [x] Identified that the old architecture is centered on a Skill Library, while the new target is a broader Personal OMP Harness.
- [x] Decided that skills remain important, but are one layer alongside runtime policy, model routing, custom agents, context management, and observability.
- [x] Evaluated current OMP `/vibe` implementation and found that `fast -> sonic`, `good -> task` are bundled agent mappings with a relatively full child harness/tool surface.
- [x] Decided not to depend on bundled `/vibe` as the core abstraction. Prefer normal custom task agents plus persistent sessions/hub coordination.
- [x] Established context-transfer principle: director sends task intent/boundaries; worker retrieves needed parent context via `history://Main`/parent agent transcript.
- [x] Established three context levels: Direct, Referenced, Explicit Contract.
- [x] Identified current OMP compaction methods and default order: `remote -> snapcompact -> handoff -> shake -> soft`.
- [x] Established preferred legacy/fallback experiment: `shake -> soft`.
- [x] Verified `compactionModel` is per-model metadata in `models.yml`, and changing compaction model does not change the main session model.
- [x] Identified a limitation: current compaction calls inherit the main session thinking level; there is no separate `compaction.thinkingLevel` setting.
- [x] Evaluated experimental Notes-backed context windows and identified them as highly relevant for the long-lived main/director session.
- [x] Added `docs/HARNESS_V2_GUIDE.md` with the detailed current design.

### In Progress

- [ ] Convert the architecture into concrete repository-managed config, models, agents, install behavior, and workflow references.

### Pending

- [ ] Inspect the exact current install/update scripts before deciding how `config.yml`, `models.yml`, and `agents/` should be deployed.
- [ ] Add canonical tracked config/model files without secrets.
- [ ] Add custom agents with small tool surfaces.
- [ ] Refactor `omp-workflow` so delegation/context policy is clear and does not overload the main `SKILL.md`.
- [ ] Add a bounded-executor skill/reference for Luna Max workers.
- [ ] Decide whether Notes-backed context management should be enabled by default or remain opt-in after compatibility/behavior testing.
- [ ] Add validation for model-role references, agent frontmatter/tool lists, missing autoloaded skills, YAML syntax, and accidental secrets.
- [ ] Update README/architecture docs after implementation shape stabilizes.
- [ ] Run real A/B experiments and capture results.

## Key Decisions

- **Repository becomes configuration source of truth**: Track portable `config.yml`, `models.yml`, agents, skills, and related harness docs in `omp-kit`; deploy them into OMP through an idempotent install/sync path.
- **Control plane / workforce split**: Strong model handles interpretation, decomposition, integration, ambiguity, and important review; cheap workers handle high-volume execution.
- **Preferred model roles**: main/director `Sol Medium`; routine worker `Luna High`; hard bounded worker `Luna Max`; high-risk/final review `Sol High`; Sol Max only exceptional; Terra retained only as optional fallback/niche.
- **Do not use expensive director tokens for context copying**: Workers should read the parent transcript themselves when the task depends on prior discussion.
- **Context pull over automatic inheritance**: Do not inject full parent history into every worker. Fetch context only when useful.
- **Conversation authority hierarchy**: latest explicit user decisions > earlier unsuperseded user decisions > assistant conclusions accepted by user > repository facts > exploratory/tentative discussion.
- **Custom agents over bundled Vibe workers**: Use OMP custom task agents for model, effort, tool, autoload skill, and spawn control. Build persistent orchestration around task/hub primitives.
- **Minimal worker tools**: Start workers with the smallest tool set required by task shape; do not automatically expose web/MCP/subagent spawning/full extensions.
- **Bounded execution**: Stop after acceptance criteria and relevant verification pass; after two materially different failed repair attempts on one blocker, return evidence to the director instead of looping indefinitely.
- **Review selectively**: Normal work gets worker verification + director sanity check. Independent Sol review is for high-risk/high-failure-cost changes.
- **Legacy compaction preference**: Start with `shake -> soft`, not the full default method chain, for controlled experiments.
- **Notes-backed context is promising**: Main session can use persistent notes + recent context + searchable raw session history instead of repeated lossy recompression. Restricted workers can remain simple and use legacy context maintenance.
- **Do not overuse `.planning/` artifacts**: Use durable artifacts when state must survive sessions/people, not simply because a task is large.

## Critical Context

### Current preferred conceptual role mapping

```yaml
modelRoles:
  default: cpa/gpt-5.6-sol:medium

  smol: cpa/gpt-5.6-luna:high
  fast_worker: cpa/gpt-5.6-luna:high

  task: cpa/gpt-5.6-luna:max
  good_worker: cpa/gpt-5.6-luna:max

  commit: cpa/gpt-5.6-luna:medium
  tiny: cpa/gpt-5.6-luna:low

  plan: cpa/gpt-5.6-sol:high
  designer: cpa/gpt-5.6-sol:medium
  vision: cpa/gpt-5.6-sol:high

  slow: cpa/gpt-5.6-sol:high
  review: cpa/gpt-5.6-sol:high
```

Caveat: OMP's built-in reviewer currently uses the `slow` role; a `review` role matters only if a custom reviewer explicitly uses `@review`.

### Proposed custom agents

Initial set:

```text
luna-code   Luna High   normal scoped implementation
luna-deep   Luna Max    hard bounded implementation/debugging
luna-doc    Luna Max    documentation/config synthesis
sol-review  Sol High    high-risk/final review
```

Possible later agent:

```text
context-curator  Luna High/Max
```

Suggested `luna-code` tool surface:

```text
read
grep
glob
edit
bash
hub
yield
```

Suggested `luna-doc` tool surface:

```text
read
grep
edit
write
hub
yield
```

OMP automatically adds `yield` for explicit task-agent tool lists. Avoid `task`/spawning unless the agent actually needs recursion.

### Parent-context retrieval

Workers should use concise parent transcript retrieval:

```text
read history://Main
```

(or the actual parent id).

Important distinction:

- `history://<id>` exposes another registered agent's concise transcript.
- Notes-backed `history://current/full` exposes raw historical entries only for the calling session's own current branch; it does not expose another agent's raw history.

### Notes-backed context window

Candidate setting:

```yaml
compaction:
  experimentalContextManagement: true
```

Restart the session after enabling because the effective tool roster changes.

Main tools/features:

- `context_notes`: persistent notebook; replacement limited to 16,384 UTF-8 bytes.
- `new_context`: starts a new local context window at a safe boundary while keeping notes/recent complete tool units.
- `history://current/full`: searchable/readable raw current-session history with stable entry ids/window boundaries.

Restricted sessions without `context_notes`, `new_context`, `read`, and `grep` automatically retain legacy compaction behavior.

### Legacy compaction fallback

Candidate config:

```yaml
compaction:
  enabled: true
  methodOrder:
    - shake
    - soft
  asyncEnabled: false
  keepRecentTokens: 20000
```

`asyncEnabled: false` is initially recommended only to make quota/cost experiments easier to interpret; it can be re-enabled later.

### Compaction model

`compactionModel` belongs in `models.yml` model metadata, e.g. conceptually:

```yaml
providers:
  cpa:
    modelOverrides:
      gpt-5.6-sol:
        compactionModel: cpa/gpt-5.6-luna
```

Adapt this to the repository's actual `models.yml` provider shape instead of copying blindly.

Current OMP limitation: the compaction target model is independently selectable, but compaction thinking effort inherits the main session's thinking level. Do not claim that setting Luna as `compactionModel` automatically makes compaction Luna High.

### Existing repository philosophy worth preserving

Retain where practical:

- resource metadata/provenance;
- registry generation;
- validation;
- draft -> active promotion;
- one skill per stable owner domain;
- thin `SKILL.md`, detailed references;
- reusable workflow guidance separated from project-specific facts.

Existing skills likely to keep largely intact:

```text
skill-authoring
omp-design
omp-research
omp-debug
git-workflow
autodl
document-parser
program-language
```

Existing skills likely to narrow/refocus because OMP base prompt now covers some of their guidance:

```text
code-taste
omp-test
omp-review
omp-verification
```

`omp-workflow` and `.planning` lifecycle need the most architectural reconsideration: durable project state should be separated from runtime agent orchestration.

### Recommended `omp-workflow` reference split

```text
skills/omp-workflow/
  SKILL.md
  references/
    delegation.md
    subagent-context.md
    execution.md
    phase-lifecycle.md
    ...
```

`delegation.md`:

- worker selection;
- concurrency;
- persistent worker reuse;
- escalation;
- avoid duplicate `fast + good` work;
- repair budget.

`subagent-context.md`:

- Direct / Referenced / Explicit Contract context levels;
- `history://Main` usage;
- context authority hierarchy;
- when to reread parent history;
- ambiguity return policy.

### Proposed repository ownership

Desired end-state concept:

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
├── docs/
├── scripts/
├── schemas/
└── tests/
```

Do not force this exact layout if the repository's existing installer/registry conventions suggest a cleaner integration.

### Installation requirements

Repository-managed config must:

- be portable and secret-free;
- support an idempotent install/sync path;
- avoid silently destroying local config;
- back up/diff existing live files or require explicit force mode for destructive replacement;
- validate configuration before applying it;
- handle machine-specific secrets/overrides outside tracked canonical files.

Prefer simple symlink/copy management over inventing a templating framework unless concrete machine-specific requirements justify templates.

## Next Steps

1. Read `docs/HARNESS_V2_GUIDE.md` completely before editing.
2. Inspect the current repository tree, README, AGENTS, install scripts, validation scripts, registry schemas, `omp-workflow`, and current resource installation logic.
3. Produce a concrete implementation plan that maps new config/models/agents into the existing repository conventions with minimal churn.
4. Add canonical tracked `config.yml` and `models.yml` without secrets. Do not guess credential/provider details that are not already known from the repo or user configuration.
5. Extend installer/validation so repo-managed configuration and agents can be deployed safely to `~/.omp/agent`.
6. Add the initial custom worker/reviewer agents with small tool surfaces and role-based model routing.
7. Add/refactor bounded-executor guidance and `omp-workflow` context/delegation references.
8. Add Notes-backed context configuration only after checking the installed OMP version/schema and making the experimental nature clear.
9. Update architecture/README after implementation, not before, so documentation matches reality.
10. Run repository validation/tests. Report exact files changed, commands run, test results, unresolved assumptions, and any decisions that still require user input.

Do not perform unrelated cleanup or broad refactors while carrying out this migration.
