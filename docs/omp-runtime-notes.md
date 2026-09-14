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

The registry and resource metadata support library maintenance; OMP native discovery reads the Skill files. Keep unreviewed third-party material outside active discovery paths.

## Tools and extensions

Use a tool/CLI when deterministic work or complex side effects warrant an implementation rather than fragile shell prose. Prefer clear inputs/results, non-zero failure status, bounded cancellation/cleanup, JSON output where useful, and previews for risky operations.

Use an extension when actual OMP hooks, lifecycle or custom-tool registration are required. Do not wrap every CLI in an extension just to make the diagram uniform.

The current feedback extension is deliberately bounded: append observed evidence with supported session provenance. It neither modifies the repository nor promotes reports to policy. No first-class caller-agent identity is fabricated when the public context does not provide it.

## MCP and service integrations

MCP is useful when a separate service/process or reuse across clients has real value. An OMP-specific local capability may be simpler as a CLI or extension.

Service integrations must state their credentials, network/data-disclosure behavior, billing and destructive consequences. Keeping AutoDL or document-parser in the Skill library does not authorize starting compute or uploading a document. Dependency installation and account configuration remain deliberate user actions.

## Sessions and coordination

OMP owns raw sessions, history, task lifecycle, messaging and capability enforcement. Use the available public contracts rather than reconstructing a private journal format or adding a second scheduler/message/result store.

The recorded 18.1.20 source audit supports `agent://<id>` final artifacts and `history://<id>` transcript retrieval in their relevant session context. Match actual runtime schemas instead of inventing commands from remembered versions. Desired semantic wait/message and reviewer-LSP gaps are tracked in #7.

Context notes assist current-session continuity, not universal cross-session memory. Empty text cleared notes on the earlier tested runtime; never assume an empty mutation call is a read. Current accepted project knowledge lives in repository docs, design and evidence.

## Observation

OMP records sessions and normalizes usage. The session-evidence collector derives compact local summaries using published stats/trace interfaces; see [session evidence](session-evidence.md).

The recorded 18.1.21 interaction exposed a storage-folder versus actual-cwd mismatch. The collector filters real project paths using public trace cwd. Provider data is sampled, cost is cost-equivalent rather than quota, and activity envelopes do not prove compute concurrency.

## Supply-chain and configuration discipline

Review downloaded Skills, scripts and packages before putting them in active locations. Check executable content, package installation, network/secrets access, SSH/cloud actions, destructive commands, prompt injection and licensing. The existing risk scanner helps locate concerns but does not prove safety.

Keep useful reference provenance in maintained metadata. Credentials, real model/provider routes and MCP connections stay in the user's environment, not a canonical personal config snapshot distributed by the plugin.

## Reference entry points

- OMP repository and versioned source: https://github.com/can1357/oh-my-pi
- OMP releases: https://github.com/can1357/oh-my-pi/releases
- [Configuration ownership](omp-configuration.md)
- [Installation](omp-installation.md)
- [Architecture](architecture.md)
- [Validation and claim limits](VALIDATION.md)
