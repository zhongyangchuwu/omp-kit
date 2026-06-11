# Pi / OMP Runtime Notes

## Purpose

This document records Pi Kit's working model for Pi and Oh My Pi (OMP) capabilities. It is a stable mental model for designing skills, absorbing third-party skills, writing OMP extensions, adding custom tools, and deciding when MCP is warranted.

It is not an exhaustive API reference. Current behavior, field names, and configuration details must be checked against the official Pi and OMP documentation before implementing runtime integrations.

## Capability model

```text
Skill       = task guidance, workflow, decision rules, and references for the model
Custom Tool = typed function the model can call directly
Extension   = OMP runtime layer that registers tools, commands, hooks, and interceptors
Tool / CLI  = deterministic local program that performs complex work
MCP Server  = standard cross-process tool service for reuse across clients
Package     = installable bundle of skills, extensions, prompts, themes, and metadata
```

Short form:

```text
Skill is the map.
Extension is the nerve interface.
Tool / CLI is the muscle.
MCP is an external organ.
Package is the installable unit.
```

## Pi and OMP

Pi is the base coding/terminal agent runtime. Its documentation is the best source for stable concepts such as skills, packages, settings, providers, sessions, prompt templates, themes, release notes, and programmatic usage.

OMP is an independently maintained Pi-derived runtime, not a thin repackaging of upstream Pi. Its packages use the `@oh-my-pi/*` scope, it is Bun-first, and it keeps a stronger local agent surface: built-in tools, LSP/debugger/browser/Python/Bun/subagent workflows, custom tools, native extension loading, MCP configuration, and internal URL schemes such as `skill://`, `pr://`, and `issue://`.

Use Pi docs for stable packaging and resource concepts. Use OMP docs for custom tools, runtime extensions, native config paths, MCP configuration, OMP-specific skill behavior, and fork-specific runtime semantics.

OMP has compatibility paths for some Pi concepts, package scopes, and `pkg.pi` extension metadata, but compatibility is not identity. Some upstream APIs are renamed, stubbed, skipped, or reworked around OMP's Bun/native/tool/session architecture.

## OMP fork model and upstream sync

Treat OMP as a maintained fork with intentional divergences. Useful upstream Pi changes may be merged, backported, or semantically ported, but there is no fixed sync SLA. The observed pattern is opportunistic: important fixes and low-conflict features can land quickly, while changes touching OMP-specific architecture are manually adapted or skipped.

When checking whether upstream behavior exists in OMP:

1. Check current Pi docs and release notes.
2. Check current OMP docs, release notes, and package changelogs.
3. For extension/runtime APIs, prefer OMP documentation and source over Pi assumptions.
4. Assume package scopes, runtime APIs, auth storage, tool factories, native modules, and extension loading may differ until verified.

Known OMP divergences that affect design decisions:

- package scope mapping from upstream `@mariozechner/*` or `@earendil-works/*` to `@oh-my-pi/*`;
- Bun-first runtime, package manager, scripts, and CI;
- native capabilities through `@oh-my-pi/pi-natives`;
- OMP tool factories built around session-aware tool creation;
- extension loading through Bun native `import()`;
- `pkg.omp` preferred for extension metadata, with `pkg.pi` kept as fallback;
- credential storage in `agent.db` with multi-credential/session-affinity behavior;
- OMP-specific status line, subagent, IRC, internal URL, MCP, browser, debugger, and shell-tool behavior.

Before porting or depending on upstream Pi behavior, read the OMP porting notes and preserve documented OMP-only features instead of overwriting them with upstream defaults.

## Documentation and changelog lookup

For current facts, check both documentation and changelogs:

- Pi latest docs for canonical upstream concepts.
- Pi release notes for recent upstream changes.
- OMP `omp://` docs for the local/runtime documentation snapshot.
- OMP GitHub docs for the current public documentation on `main`.
- OMP package changelogs and GitHub releases for fork-specific changes.

Do not infer parity from similar names. Verify the exact version and runtime when implementing integrations.

## Skill

A skill is a file-backed capability pack. In this repository, active skills live under:

```text
skills/<name>/SKILL.md
```

A skill is appropriate for:

- task boundaries;
- workflow steps;
- review checklists;
- tool selection guidance;
- safety rules;
- references and examples;
- instructions for when to use a deterministic tool.

A skill should not directly carry complex execution semantics. Do not put API wrappers, multi-step local execution, schema-sensitive model calls, or high-risk side effects solely into prose. Use an extension and tool/CLI for those.

Third-party nested skills must not become active accidentally. If a third-party collection is represented as one local skill, keep upstream nested skills under a reference path such as `references/skills/` rather than top-level `skills/`.

## Custom Tool

A custom tool is a typed callable capability exposed to the model. It typically has:

- a name;
- a description;
- parameter schema;
- an execute function;
- structured output;
- error handling;
- cancellation support;
- optional streamed updates.

Use a custom tool when the model should call code rather than hand-author shell commands.

## Extension

An extension is the OMP runtime integration layer. It can register related custom tools, slash commands, keyboard shortcuts, renderers, lifecycle event handlers, message injection, and tool-call/tool-result interceptors.

Use an extension when a capability requires:

- several related tools;
- runtime lifecycle handling;
- parameter validation before side effects;
- confirmation or audit behavior;
- interception of tool calls or results;
- wrapping a Python/Node/Rust CLI for the model.

Extensions are glue. Put heavy deterministic business logic in `tools/`.

## Tool / CLI

A local tool or CLI is the deterministic implementation behind a capability. It may be written in Python, TypeScript, Rust, Go, or another suitable language.

Recommended contract:

- supports `--help`;
- supports JSON output for machine callers;
- returns non-zero exit codes on failure;
- writes clear stderr for humans;
- supports `--dry-run` for risky actions;
- avoids overwriting source files by default;
- reads secrets only from environment variables or explicit config paths;
- is tested independently from the model.

Preferred call chain:

```text
Model -> OMP custom tool -> extension -> local CLI -> JSON result -> model
```

## MCP Server

An MCP server is useful when the tool should be reused outside OMP or must run as a separate process with a standard tool protocol.

Use MCP when:

- a tool should serve multiple agent clients;
- the tool needs a long-running process;
- the tool wraps an external service;
- the protocol boundary is valuable;
- future ecosystem integration matters.

If the capability is local and OMP-specific, prefer a custom tool or extension first.

## Package

A package is an installable unit for combining capabilities. It may include skills, extensions, prompt templates, themes, and metadata. Use packages for complete capability bundles, high-risk opt-in features, multi-machine synchronization, team sharing, and temporary trials.

A mature capability often becomes:

```text
skill + extension + tool + package
```

## Recommended boundaries

```text
Use a skill        when the capability is workflow, judgment, or reference material.
Use a custom tool  when the model should call a typed function.
Use an extension   when runtime integration, hooks, or multiple tools are needed.
Use a tool / CLI   when deterministic local work must be implemented and tested.
Use MCP            when cross-client reuse or process isolation matters.
Use a package      when a capability should be installed, disabled, shared, or versioned as a unit.
```

## Third-party intake principles

Do not put unreviewed third-party skills, scripts, or packages into active runtime locations.

Keep upstream repositories, books, documentation snapshots, and third-party skill collections in local gitignored `references/`. Extract only reviewed, useful material into tracked resources:

```text
references/ -> drafts/ -> skills
```

Review for:

- executable files;
- package managers and install scripts;
- network access;
- secrets access;
- shell snippets;
- prompt injection;
- destructive file operations;
- SSH or cloud-resource access;
- license constraints.

## Risk levels

```text
Low:
  Instruction-only. No executable code, secrets, network, SSH, billing, or destructive operations.

Medium:
  Local scripts or tooling may exist, but no secrets, external systems, billing, SSH, or destructive operations are required.

High:
  Secrets, network services, SSH, paid/cloud resources, billing, deletion, stopping, or external writes may be involved.
```

High-risk capabilities should not be blindly auto-linked. Prefer package-level opt-in, explicit confirmation for destructive actions, dry-run support, and clear audit output.

## Reference links

- Pi docs: https://pi.dev/docs/latest
- Pi release notes: https://pi.dev/news/releases
- Pi skills: https://pi.dev/docs/latest/skills
- Pi packages: https://pi.dev/docs/latest/packages
- Pi extensions: https://pi.dev/docs/latest/extensions
- Pi settings: https://pi.dev/docs/latest/settings
- OMP repository: https://github.com/can1357/oh-my-pi
- OMP releases: https://github.com/can1357/oh-my-pi/releases
- OMP coding-agent changelog: https://github.com/can1357/oh-my-pi/blob/main/packages/coding-agent/CHANGELOG.md
- OMP porting notes: https://github.com/can1357/oh-my-pi/blob/main/docs/porting-from-pi-mono.md
- OMP skills: https://github.com/can1357/oh-my-pi/blob/main/docs/skills.md
- OMP custom tools: https://github.com/can1357/oh-my-pi/blob/main/docs/custom-tools.md
- OMP extensions: https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md
- OMP extension loading: https://github.com/can1357/oh-my-pi/blob/main/docs/extension-loading.md
- OMP MCP config: https://github.com/can1357/oh-my-pi/blob/main/docs/mcp-config.md
