# OMP Capability and Native Development Roadmap

This document records accepted future-development direction. It is not a promise that every surface below is already implemented, and it should not turn deferred infrastructure into a Harness v2 merge gate.

## Direction

`omp-kit` should increasingly build *on* OMP rather than reimplement OMP.

The ownership boundary is:

```text
OMP
  session/runtime semantics
  RPC lifecycle and subagent observability
  aggregate usage/statistics
  extension/plugin APIs

omp-kit
  personal policy and routing
  fixtures and independent acceptance checks
  install/profile portability
  Harness-specific assertions
  OMP extensions that implement genuinely new behavior
```

When a tested OMP API already provides the needed semantics, prefer that API over copying its implementation into this repository. Local compatibility code is a bounded fallback, not the long-term default.

## Reuse order

Prefer upstream surfaces in this order:

1. **Stable CLI/public behavior** when a subprocess boundary is sufficient, such as `omp stats --json` for aggregate usage data.
2. **RPC APIs** for live automation, lifecycle control and subagent observation.
3. **Published TypeScript package APIs** from `@oh-my-pi/pi-coding-agent` when in-process access is materially better.
4. **Small local fallback code** only when the installed OMP environment cannot execute the upstream path reliably.

Do not maintain a second general SessionManager, stats database, RPC host or scheduler inside `omp-kit`.

## Current upstream capability probes

Against the locally validated OMP 18.1.18 environment:

- `omp stats --json` works and should remain the authoritative general request/token/cache/duration aggregate.
- the separate Python `omp-rpc` package is not installed in the current project environment, so Python `RpcClient` cannot be assumed available;
- Bun can resolve `@oh-my-pi/pi-coding-agent/session/session-manager` and `session/session-loader`, but importing them from the current global package cache fails because the corresponding `pi_natives` addon is absent there;
- no package/native addon was installed merely to make these probes pass.

Therefore `scripts/inspect_omp_session.py` remains a deliberately narrow OMP-v3 linear-session fallback for current Harness policy evidence. It must not grow branch reconstruction, migrations, corpus analytics or general OMP compatibility logic.

## Bun and TypeScript

Bun/TypeScript is an accepted future first-class development toolchain for this repository.

This is not only for tests. OMP extensions are TypeScript-native: one extension module can register tools, commands and lifecycle handlers, and OMP prefers `index.ts` over `index.js` during extension discovery. Installable extension packages declare their entry points through `package.json` under `omp.extensions`.

The intended repository model is therefore dual-runtime:

```text
Python / uv
  portable installer
  existing deterministic repository checks
  narrow fallback utilities where Python remains simpler

Bun / TypeScript
  OMP extensions/plugins
  direct OMP package integration
  future RPC/session tooling when upstream imports are reproducible
  TypeScript unit/integration tests for those surfaces
```

Do not rewrite stable Python installer code merely for language uniformity.

### When to add package metadata

Introduce `package.json`, `bun.lock` and a minimal TypeScript configuration when the first maintained TypeScript artifact lands, for example:

- an OMP extension;
- an OMP-native runtime-smoke runner;
- a replacement for fallback session parsing that directly uses supported OMP package APIs.

At that point:

- pin the OMP package dependency to a version compatible with the OMP runtime under test before broadening the range;
- use normal Bun project installation rather than relying on incidental global Bun cache contents;
- verify that native dependencies such as `@oh-my-pi/pi-natives` install reproducibly on supported development platforms;
- keep provider/authenticated tests opt-in and outside ordinary `just test` / `just verify`.

Package metadata should serve real TypeScript code, not exist as an empty capability placeholder.

## Test infrastructure direction

The long-term test system should become a thin Harness layer over OMP capabilities.

Preferred future shape:

```text
OMP CLI / RPC / TypeScript APIs
          |
          v
omp-kit test runner
  - prepare isolated worker fixture
  - keep hidden oracle outside worker scope
  - run/observe exact worker lifecycle
  - apply Harness policy assertions
  - run independent scorer
  - emit result.json + report.md
```

Useful upstream pieces already identified include:

- `omp stats` / `@oh-my-pi/omp-stats` for aggregate usage statistics;
- OMP RPC state, session stats, subagent subscription and incremental subagent transcript APIs for live automation;
- OMP SessionManager/session-loader semantics for branch-aware session interpretation when a reproducible package dependency exists;
- OMP's existing session-stat/audit utilities as implementation references rather than code to duplicate wholesale;
- `omp render` as an optional human-readable failure diagnostic;
- OMP/robomp timeout, bounded-reminder and abort patterns as evidence for supervision policy rather than a reason to build a new scheduler.

The current Python auditor is intentionally frozen at the smaller boundary documented in `HARNESS_V2_TEST_AUTOMATION.md`.

## Migration triggers

Revisit OMP-native test/runtime tooling when one of these becomes real rather than hypothetical:

1. another runtime experiment repeats fixture/session/report bookkeeping;
2. a branched session must be audited correctly;
3. live subagent lifecycle automation becomes routine;
4. the first maintained OMP extension is implemented;
5. an OMP upgrade makes the local fallback parser materially costly to maintain.

A trigger should cause a small migration toward an upstream API, not an automatic rewrite of all existing tooling.

## Extensions

Extensions are the preferred place for OMP-native lifecycle behavior. Create an extension root only when a maintained extension module exists. Native discovery includes:

```text
~/.omp/agent/extensions/
<repo>/.omp/extensions/
```

Installable packages should use `package.json` `omp.extensions`; legacy `pi.extensions` is compatibility-only.

## Custom tools

Create a standalone tool root only when deterministic local code exists and is tested without the model. Native install paths include:

```text
~/.omp/agent/tools/
<repo>/.omp/tools/
```

Prefer an extension when the capability also needs lifecycle hooks, commands, rendering or policy interception.

## MCP

Create MCP config or server code only when a reusable process boundary is useful across clients. OMP-native config paths are:

```text
~/.omp/agent/mcp.json
<repo>/.omp/mcp.json
```

Use `.omp/mcp.json` when OMP owns the config. Use root `mcp.json` only for a deliberate portable cross-client fallback.

## Non-goals

Do not add, without concrete evidence:

- an OMP fork;
- a second generic session-format implementation;
- a replacement stats stack;
- a custom orchestration daemon or scheduler;
- provider traffic in normal CI;
- empty extension/tool/package roots created only because they might be useful later.

The desired direction is more OMP-native integration with less duplicated runtime semantics.
