# OMP runtime and capability notes

This document is a current conceptual guide for Skill authors and integration work, not a replay of OMP release history. Version-sensitive fields and commands must be checked against the installed OMP/public source; [compatibility policy](omp-compatibility.md) owns that review process.

## Capability model

| Resource | Responsibility |
| --- | --- |
| Skill | Task guidance, judgment, workflow and references for the model |
| Custom tool | A typed callable function with an explicit side-effect boundary |
| Extension | OMP lifecycle/tool integration and hooks |
| Local tool / CLI | Deterministic implementation that can be tested separately |
| MCP server | Cross-process/cross-client tool service when that boundary is useful |
| Package/plugin | Installation and resource-discovery unit |

These are implementation forms, not a ladder every capability must climb. A useful instruction-only Skill does not need a CLI, extension or separate package to justify its existence.

## OMP versus Pi

OMP is an independently maintained Pi-derived runtime. Similar names do not prove API parity. Use Pi material for background concepts and OMP's own versioned documentation/source for actual integration contracts, package scopes, plugin discovery, tools, profiles, sessions and MCP behavior.

The old v16/v17 migration notes are available in Git history. Do not carry a chronological compatibility checklist as current instructions. Check the real version and affected changelog when implementing a change.

## Skills

Maintained Skills live in `skills/<name>/SKILL.md`. They may encode personal working experience, decision rules, safety boundaries, useful templates and tool-selection knowledge. Not all are OMP-specific.

Keep task activation clear and load support files as needed. A template is not a mandatory artifact. A description or metadata category does not grant execution authority or install dependencies.

The active Skill tree is the source of truth: each `SKILL.md` owns its identity and activation description, with focused support files loaded as needed. OMP native discovery reads that tree directly; do not add a parallel resource registry solely for library maintenance. Keep unreviewed third-party material outside active discovery paths.

OMP retains differing same-name Skills under native namespaces instead of silently discarding them. Use the discovered `skill://<namespace>/<name>` identity when needed; do not invent an omp-kit collision registry.

OMP already caches compressed Skill-description hints; do not add a parallel kit optimizer. With model credentials available, a fresh native cache can schedule background inference during discovery. Read-only resource loading is not a guarantee of zero model work; offline smokes must isolate credentials and outbound requests without changing the user's settings.

## Tools and extensions

Use a tool/CLI when deterministic work or complex side effects warrant an implementation rather than fragile shell prose. Prefer clear inputs/results, non-zero failure status, bounded cancellation/cleanup, JSON output where useful, and previews for risky operations.

Use an extension when actual OMP hooks, lifecycle or custom-tool registration are required. Do not wrap every CLI in an extension just to make the diagram uniform.

The current plugin has no runtime extension or CLI for feedback or session analysis. Use OMP's native session/history and stats interfaces for its own session data and usage metrics; these are not an equivalent to the retired feedback-analysis tool.

## MCP and service integrations

MCP is useful when a separate service/process or reuse across clients has real value. An OMP-specific local capability may be simpler as a CLI or extension.

Service integrations must state their credentials, network/data-disclosure behavior, billing and destructive consequences. Keeping an integration Skill such as `document-parser` in the library does not authorize uploading a document or performing other external side effects. Dependency installation and account configuration remain deliberate user actions.

## Sessions and coordination

OMP owns raw sessions, history, task lifecycle, messaging and capability enforcement. Use the available public contracts rather than reconstructing a private journal format or adding a second scheduler/message/result store.

OMP owns job settlement; results and messages auto-deliver. `wait` can watch the
caller's own background jobs/services or an outstanding direct-message reply;
it is not a general peer polling API. Wait only when blocked, and use `read
proc://` for a non-consuming status check when intervention needs evidence.
Use native progress/completion estimates rather than an omp-kit timing loop.
Messaging remains `write agent://<id>`; outputs and same-session transcripts
remain `agent://<id>` and `history://<id>`. Semantic message filtering and
per-agent read-only LSP remain separate concerns in #7.

Ordinary `task` children return their final assistant message by default; schema-bearing `yield` completion is opt-in through `task.structured` or agent frontmatter `structured: true`. Eval `agent()` and workpool keep their structured completion contract. Per-call model selection is off by default and requires explicit operator authorization; see [configuration](omp-configuration.md).

Saved-model restore failures are explicit rather than a silent fallback; an
intentional route change uses OMP's explicit native model override. omp-kit does
not itself resume or switch SDK sessions. Native JSON query and visual rendering
remain OMP-owned, not kit implementations.

Native `omp --restore <session>` is the crash-recovery path for an interrupted turn and its subagents, not an omp-kit worker-revival layer. Session entries now record the build that wrote them; `/session` lists those builds, which is more precise than the currently installed executable for a session spanning an upgrade. These native changes do not establish fresh lifecycle acceptance for #7 or #31.

For cross-session retrieval, use the read-only native `archive` eval global; `/dump all` is the native full main/subagent transcript export. OMP's session/history and stats interfaces provide transcript and usage views, not the retired feedback analysis. Context notes assist current-session continuity, not cross-session memory: omit text for a read, and treat an empty string as a clear operation. Accepted project knowledge stays in repository docs, design and selected evidence.

For shareable diagnostics, native `omp anonymize` and `/dump anon` redact session/subagent copies. Inspect the resulting artifact before sharing; these commands do not authorize publication.

## Observation

OMP records sessions and normalizes usage. Use its native session/history and stats interfaces for these data; they do not provide an equivalent to the retired omp-kit feedback-analysis tool.

## Supply-chain and configuration discipline

Review downloaded Skills, scripts and packages before putting them in active locations. Check executable content, package installation, network/secrets access, SSH/cloud actions, destructive commands, prompt injection and licensing. Use environment-native security scanners or targeted review tools when they provide useful evidence; omp-kit does not maintain a bespoke heuristic risk scanner.

Keep useful reference provenance in the owning maintained source. Credentials, real model/provider routes and MCP connections stay in the user's environment, not a canonical personal config snapshot distributed by the plugin.

## Reference entry points

- OMP repository and versioned source: https://github.com/can1357/oh-my-pi
- OMP releases: https://github.com/can1357/oh-my-pi/releases
- [Configuration ownership](omp-configuration.md)
- [Installation](omp-installation.md)
- [Architecture](architecture.md)
- [Validation and claim limits](VALIDATION.md)
