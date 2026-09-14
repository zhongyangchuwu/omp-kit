# OMP native configuration ownership audit

Status: Phase 1 native core plugin implementation record for the
`omp-native-foundation` branch. The Phase 0 ownership classifications remain the basis
for migration; the native path now changes resource distribution and agent model
ownership while the legacy installer/configuration path remains available.


## Goal

`omp-kit` should provide reusable workflow behavior and optional integrations without
silently replacing a user's OMP preferences. Installation should prefer OMP's plugin
system for agents, skills, rules and extensions. Persistent OMP settings should remain
user-owned unless a setting is strictly required for omp-kit correctness.

The target principle is:

> omp-kit defines behavior and optional capabilities; OMP and the user own the runtime
> environment, concrete models and ordinary preferences.

A useful configuration value is not automatically an installation requirement.
Measured recommendations should be exposed as presets, examples or doctor guidance,
not written merely because they worked on one machine.

## Ownership classes

- **REQUIRED** — omp-kit cannot behave correctly without this semantic contract.
- **USER-OWNED** — normal OMP preference/capability choice. The plugin must not change it.
- **OPTIONAL PRESET** — a tested/recommended choice that a user may opt into explicitly.
- **INTEGRATION CAPABILITY** — facts needed only when an optional provider/integration is enabled.
- **LEGACY / MIGRATION** — retained only to migrate or explain the existing Harness v2 install.
- **PROBE** — ownership direction is clear, but runtime behavior must be tested before removal.

## Current `config/config.yml`

The current file is primarily a snapshot of one working OMP setup, not a minimal
omp-kit contract. It includes model routing, UI preferences, tool toggles, context
management, browser/LSP behavior, retry policy and task concurrency in one managed
file. The plugin-first design should stop installing this whole mapping.

### Model selection: prefer native per-agent overrides over kit-owned roles

OMP 18.1.18 has built-in model roles:

```text
default, smol, slow, vision, plan, commit, tiny, task, advisor
```

`fast_worker`, `good_worker`, `review`, and the old `designer` role are not built-ins.
OMP recognizes a custom `@role` alias only when that role already exists in settings;
an unconfigured custom alias remains a literal model pattern rather than becoming a
portable semantic fallback. The current agents therefore should not keep requiring
`@fast_worker`, `@good_worker`, or `@review` in a zero-config plugin install.

OMP already has a more native user-owned mechanism. Task model priority is:

```text
task.agentModelOverrides[agent]
-> agent frontmatter model
-> configured task/session model fallback
```

The `/agents` hub exposes the per-agent model override and persists it through OMP
settings. Agent frontmatter `model` is optional. Therefore the preferred plugin-first
contract is:

- core omp-kit agents do **not** force a concrete model or a custom role alias;
- with no override, an agent follows normal OMP task/session fallback behavior;
- users who care about routing set each agent's model through `/agents` or native OMP
  settings;
- omp-kit may provide explicit opt-in presets that populate those overrides.

This removes custom role bindings from the required install contract entirely. If a
future grouped-role UX is useful, it can be added as an optional convenience rather
than a prerequisite for agent discovery.

The current role map is classified as follows:

| Current setting | Classification | Direction |
| --- | --- | --- |
| `modelRoles.default` | USER-OWNED | Never replace the user's default model. |
| `modelRoles.smol` | USER-OWNED | Built-in OMP role; leave to the user. |
| `modelRoles.task` | USER-OWNED | Built-in task routing; leave to the user. |
| `modelRoles.commit` | USER-OWNED | Leave to the user. |
| `modelRoles.tiny` | USER-OWNED | Leave to the user. |
| `modelRoles.plan` | USER-OWNED | Leave to the user. |
| `modelRoles.designer` | LEGACY / MIGRATION | Not a current OMP built-in role. |
| `modelRoles.vision` | USER-OWNED | Leave to the user. |
| `modelRoles.slow` | USER-OWNED | Leave to the user. |
| `modelRoles.fast_worker` | OPTIONAL PRESET / LEGACY | No longer required by the target core agents. |
| `modelRoles.good_worker` | OPTIONAL PRESET / LEGACY | No longer required by the target core agents. |
| `modelRoles.review` | OPTIONAL PRESET / LEGACY | No longer required by the target core agents. |

The validated Sol/Luna mapping remains useful evidence and may become a named preset,
but it should not be installed automatically.

### Global model/generation preferences

`defaultThinkingLevel`, `temperature`, `topP`, and `hideThinkingBlock` are
**USER-OWNED**. omp-kit agents must not change the user's global generation defaults.
A user-selected per-agent model selector may still include a thinking-effort suffix in
the ordinary OMP way.

### UI and presentation

The following are **USER-OWNED**:

- `theme`
- `symbolPreset`
- `statusLine`
- `display`
- `composer`
- `colorBlindMode`

The current `headless` overlay is therefore not a core omp-kit profile. If retained,
it should be an example/preset or migration aid rather than an installed policy.

### Editing, reading and language tooling

The following are **USER-OWNED**:

- `edit`
- `readLineNumbers`
- `read`
- `lsp`
- `astGrep`
- `astEdit`
- `glob`
- `grep`
- `eval`
- `bashInterceptor`

The custom workers already constrain their exposed tools in agent frontmatter. They
should not require changing how the user's main session configures those tools.

### Optional runtime capabilities

The following are **USER-OWNED** capability choices:

- `todo`
- `recipe`
- `debug`
- `web_search`
- `browser`
- `fetch`
- `images`
- `github`
- `renderMermaid`
- `checkpoint`
- `mcp`
- `plan`
- `goal`
- `memory`
- `marketplace`
- `skills`
- `commands`
- top-level `providers: {}`

omp-kit should detect/use available capabilities where relevant, not enable them on
installation.

### Task execution settings

OMP's task tool already supports both batch/single and async/synchronous operation.
`task.batch` defaults on in OMP 18.1.18, and the tool accepts the flat single-spawn form
for internal/backward-compatible callers even in batch mode. Async-off simply makes
non-blocking agents settle inline. omp-kit workflow policy should adapt to the exposed
live tool shape instead of owning either setting.

| Current setting | Classification | Reason |
| --- | --- | --- |
| `task.batch` | USER-OWNED | Wire/scheduling preference; workflow can use the live schema. |
| `task.eager` | USER-OWNED | Scheduling preference. |
| `task.maxConcurrency: 4` | USER-OWNED | Capacity/quota/machine dependent; 4 is a tested local choice, not a requirement. |
| `task.maxRecursionDepth: 1` | USER-OWNED | omp-kit workers already declare `spawns: []`; recursion policy belongs to the user. |
| `task.isolation.*` | USER-OWNED | Repository/workflow dependent. |
| `task.agentModelOverrides.sonic` | OPTIONAL PRESET | Only affects explicit built-in Vibe compatibility. |
| `task.agentModelOverrides.task` | OPTIONAL PRESET | Same. |
| `task.disabledAgents` | USER-OWNED | User availability policy. |
| `task.prewalk` | USER-OWNED | Optimization/policy choice. |
| `task.enableEffort` | USER-OWNED | Adds a task-wire effort field; not a core agent requirement. |
| `async.enabled` | USER-OWNED | Changes delivery mode, not correctness semantics. |

A future preset may recommend concurrency or async choices for a particular provider or
machine, but installation must default to keeping the user's current values.

### Compaction and context management

All current `compaction.*` values are **USER-OWNED**, with one important distinction:

- `experimentalContextManagement: true` enables notes-backed capabilities used by an
  optional workflow path, but the workflow documentation already treats notes as
  optional and describes legacy behavior for restricted workers.
- `methodOrder: [remote, soft]`, `thresholdPercent`, and `enabled` are runtime/cost/
  provider preferences, not Harness correctness requirements.

Therefore omp-kit should not enable notes-backed context or select a compaction chain
on install. A doctor can report whether notes-backed context is available; the workflow
must continue to degrade gracefully when it is not.

`config/profiles/legacy-context.yml` is consequently **LEGACY / MIGRATION** rather than
part of the future core installer.

### Retry, prewalk, advisor and TTSR

The following are **USER-OWNED**:

- `retry.*`
- top-level `prewalk.*`
- `advisor.*`
- `ttsr.*`

Bounded-executor and director supervision rules operate at the workflow layer and do
not require omp-kit to overwrite these OMP runtime policies.

## Current `config/models.yml`

The current file mixes provider capability facts, local endpoint choices, pricing
references and optimization policy. The plugin-first design should split those.

### CPA provider

OMP 18.1.18 can register the current CPA transport and most static model fields at
runtime, including thinking metadata, cost, context/max output and compatibility data.
However, the public extension `ProviderModelConfig` type omits `compactionModel` even
though the internal `ModelRegistry` input and runtime object path accept and retain it.
A typed CPA extension is therefore not yet fully capability-equivalent to the managed
`models.yml` block without omitting that field, using an unsafe type escape, or obtaining
an upstream API/type change.


| Field | Classification | Direction |
| --- | --- | --- |
| provider id `cpa` | INTEGRATION CAPABILITY | Only exists when the optional CPA integration is enabled. |
| `api: openai-responses` | INTEGRATION CAPABILITY | Transport fact for the integration. |
| `authHeader: true` | INTEGRATION CAPABILITY | Provider transport behavior. |
| `baseUrl: http://localhost:8317/v1` | USER-OWNED / machine-specific | May be an integration default, but must remain overridable. |
| `apiKey: CPA_API_KEY` | INTEGRATION CAPABILITY with user secret | Never own the secret value. |
| model ids/names | INTEGRATION CAPABILITY | Runtime provider catalog facts. |
| `reasoning`, `input`, `contextWindow`, `maxTokens` | INTEGRATION CAPABILITY | Model capability metadata. |
| supported `thinking.efforts` | INTEGRATION CAPABILITY | Model capability metadata. |
| `thinking.defaultLevel` | OPTIONAL PRESET unless provider semantics require it | Do not use it to impose routing policy. |
| `cost` | PROBE / integration metadata | Runtime static model registration requires a cost object; decide how to represent user-supplied estimates without implying quota/billing truth. |
| `compactionModel: cpa/gpt-5.6-luna` | OPTIONAL PRESET | Cost/quality optimization policy, not an intrinsic model property. |

CPA should therefore be an optional plugin integration rather than a prerequisite for
omp-kit core. OMP plugin features can gate additional extension entry points, so a CPA
registration extension can be opt-in instead of loading for every user.

There is one credential caveat to preserve: OMP model config treats a plain API-key
string as env-name-first and then literal. A missing `CPA_API_KEY` can therefore become
the literal text `CPA_API_KEY`. Plugin setting schemas can declare `secret` and `env`,
but `getPluginSettings()` returns persisted global/project values only; it does not
apply the schema default or environment fallback, and `ExtensionAPI` exposes no direct
plugin-settings accessor. The offline probe achieved fail-closed behavior by declining
registration when no resolved credential existed and by passing the resolved secret
value, not the env-variable name, to `registerProvider`. A maintained integration must
make that resolution path explicit.

### DeepSeek provider

The current custom DeepSeek block is **OPTIONAL INTEGRATION / PERSONAL CONFIG**, not
omp-kit core. Nothing in the current worker/workflow contract requires DeepSeek.
It should not be installed merely because it existed in the imported machine snapshot.
If future omp-kit behavior specifically needs a DeepSeek integration, audit that as a
separate optional feature.

## Agents

Phase 1 keeps the established agent identities while changing only their distribution
and model ownership:

- `luna-code`
- `luna-deep`
- `luna-doc`
- `sol-review`

Their `model` frontmatter is now omitted. Native `task.agentModelOverrides` owns any
user-selected routing, and agents otherwise inherit the normal task/session model.
Renaming them to task-shaped identities remains a separate compatibility migration;
combining that rename with plugin distribution would make regressions harder to isolate.

Existing prompts, docs and historical evidence can therefore continue to use the old
names while the native plugin path is validated.

The following agent properties remain **REQUIRED omp-kit behavior**:

- explicit tool surfaces;
- `spawns: []` for bounded workers;
- bounded-executor / review autoload;
- execution/review instructions and escalation semantics.

Concrete model and effort bindings are user-owned.

## `APPEND_SYSTEM.md`

The entry point tells the main director when to load `omp-workflow`, prefer discovered
custom agents, avoid nested orchestration, and treat retrieved history as evidence.

Phase 1 exposes the same body as `rules/omp-kit-workflow.md` with `alwaysApply: true`
and `agents: main`. OMP discovers it from the linked plugin root and filters it out for
custom subagents. `config/APPEND_SYSTEM.md` remains unchanged for the legacy Python
installer during the compatibility period.

This uses the least invasive OMP-native surface. An extension lifecycle hook remains
unnecessary unless a later runtime regression proves that the static rule mechanism is
insufficient.

## Installer consequences

The current Python installer owns `config.yml`, `models.yml`, `APPEND_SYSTEM.md`,
active skills and all custom agents, then tracks those copies with its own manifest,
backup and rollback system. Under plugin-first ownership, most of that surface should
move out of the installer:

```text
agents + skills + main-only rule + extensions
    -> OMP plugin manager

provider/model integration
    -> optional extension feature where capability-equivalent

OMP preferences and agent model choice
    -> user-owned; native /agents and OMP settings

recommended mappings/settings
    -> opt-in preset/doctor guidance

legacy managed installs
    -> migration/uninstall support only
```

The Python installer should not be translated line-for-line to TypeScript. Its long-term
role, if any, is migration from old Harness v2 managed roots after plugin-native install
is proven.

## Preliminary minimum contract

After this audit, there are currently **no ordinary `config.yml` values and no custom
model-role bindings that clearly need to be force-written by omp-kit**.

The likely minimum contract is instead:

1. omp-kit resources (agents, skills, one small main-only rule, future extensions) are
   discoverable through OMP's plugin system;
2. agents are model-neutral by default and follow native OMP task/session fallback;
3. users select per-agent models through native OMP controls, or explicitly opt into an
   omp-kit preset;
4. workflows adapt to available async/context/capability surfaces instead of enabling
   them automatically;
5. optional provider integrations register only provider/model capability that they own.

This makes `config/config.yml` a legacy migration/reference artifact rather than the
future installation source of truth.

## Phase 0 probe status

The isolated/offline probes against OMP 18.1.18 established:

1. **Model-neutral agent — PASS.** Without `model` frontmatter, the agent follows the
   active task/session model fallback.
2. **Native per-agent override — PASS.** `task.agentModelOverrides[name]`, using the
   same Settings path as `/agents`, wins and can be reset without editing the package.
3. **Plugin discovery — PASS.** `omp plugin link` discovers package `agents/`, `skills/`
   and `rules/` without copying them into the agent root; unlink removes the registration.
4. **Main-only rule — PASS.** `alwaysApply: true` plus `agents: main` includes the rule
   for Main and filters it from a custom subagent.
5. **CPA runtime registration — PARTIAL.** Project-local OMP/Bun imports and offline
   registration work, but public `ProviderModelConfig` omits `compactionModel`.
6. **CPA settings/credential path — PARTIAL.** Explicit fail-closed registration works,
   but manifest `env` metadata is not exposed as a resolved extension setting and zero
   cost means zero-priced rather than unknown.

These results justify the resource-only Phase 1 core plugin. They do not justify deleting
the legacy configuration/installer path or implementing CPA inside the core plugin.

## Migration target

If the probes succeed, target installation becomes approximately:

```text
omp plugin install/link omp-kit
        |
        +-- model-neutral agents
        +-- skills
        +-- main-only workflow rule
        +-- optional extension feature(s)
        +-- optional CPA integration

user OMP config.yml
        -> untouched by default

/agents + native OMP settings
        -> user-owned model/concurrency/runtime choices

omp-kit presets
        -> explicit opt-in only

legacy Python installer
        -> migration/deprecation path
```

This is a subtraction-first migration: remove ownership first, then add TypeScript only
for capabilities that genuinely belong to omp-kit.
