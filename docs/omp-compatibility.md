# OMP compatibility policy

OMP moves quickly. omp-kit should track the runtime contracts it depends on, not mechanically retest every upstream release.

## Principle

Treat version numbers as default review-depth signals, not compatibility evidence:

```text
version number -> default review depth
changelog/source impact -> escalation override
runtime evidence -> compatibility claim
```

A patch can include changed behavior. First read the changelog, then evaluate actual impact on the maintained product and Skills.

## Compatibility surfaces

Inspect changes relevant to:

- plugin linking, package/discovery and installed-resource loading;
- agent discovery, frontmatter, model resolution and task lifecycle;
- tool activation, mounted tools, extension/custom/MCP transports and enforcement;
- Skill/rule discovery, activation, visibility and invocation;
- extension SDK contracts used by feedback;
- user-owned configuration/profile/model behavior explicitly relied on by a maintained workflow;
- session/trace/stats/RPC and stable result/history interfaces;
- concrete tool/CLI assumptions in maintained Skills when their relevant dependency changes.

The retired config-copy installer is not a current compatibility target. Its historical guarantees do not imply ongoing support. Unrelated TUI/provider/browser fixes do not require testing omp-kit unless a used contract is affected.

## Default review depth

| Version delta | Default action |
| --- | --- |
| `x.y.z -> x.y.(z+1)` | Read changelog; no compatibility test for unrelated changes. |
| `x.y -> x.(y+1)` | Inspect relevant changed contracts/source and test affected behavior on a released runtime when needed. |
| `x -> (x+1)` | Full compatibility audit and the appropriate complete runtime-facing test set. |

These are defaults, not ceilings. A relevant patch receives targeted audit/smoke. Broad contract changes escalate further. A minor release with demonstrably unrelated changes does not justify unrelated tests merely because the middle number changed.

## Flow

1. Read all intervening changelog entries since the last triage.
2. Map entries to actual omp-kit dependencies, including affected maintained Skills.
3. Check concrete upstream work shaping a current contract when necessary.
4. Choose triage-only, targeted audit/smoke, or full compatibility audit.
5. Modify omp-kit only when a relevant accepted contract requires it.
6. Do not manufacture bookkeeping commits, generic tracking Issues or model tests for every unrelated patch.

Stronger per-agent capability scoping may be useful hardening, but bounded evidence append is not equivalent to authority-bearing mutation. Evaluate consequences instead of reintroducing the old Main-only feedback release blocker automatically.

## Evidence and state

Distinguish:

```text
latest upstream seen
latest changelog triaged
claim-specific released-runtime evidence
```

A changelog/source review is not a full runtime test. Existing smoke evidence remains relevant to its claim until that contract changes. Exact candidate CI belongs in Actions/PRs; accepted compatibility findings and limitations belong in current repository docs, with unresolved concrete problems in Issues.

## Recorded baseline

### OMP 18.2.0 triage — 2026-09-15

OMP 18.2.0 is the latest release inspected for current omp-kit contracts. The review covered changes since 18.1.21 and the relevant released source.

Relevant findings:

- **Native install path:** `omp install <target>` is a real top-level command. Local filesystem targets route to the plugin link flow, so `omp install .` is appropriate for omp-kit's long-lived editable checkout. Git specs continue through managed plugin installation. The development install docs and `just install` now use this public path.
- **Hub waiting:** 18.1.22 removed the caller `timeoutMs` argument and `async.pollWaitDuration`; waits now use an OMP-owned adaptive window beginning around 5 seconds and lengthening across consecutive waits to about 5 minutes. 18.2.0 also improves process-wait timeout diagnostics. omp-kit's delegation guidance no longer invents the removed timeout control.
- **Remaining supervision gap:** current `hub wait` still lets a matching peer message win the wait before job settlement. There is still no general progress/blocker/decision/final message kind for completion-relevant filtering, so Issue #7 remains unresolved rather than spawning a local scheduler/message layer.
- **Skill UX:** `/skill:<name>` is now represented as an atomic composer chip and user-invoked skill prompts participate more consistently in rewind/tree/copy behavior. This changes interaction/rendering, not the native Skill discovery contract omp-kit relies on.
- **SDK breaking changes:** `Settings.getGroup()` now returns shallow-frozen snapshots; removed MCP response aliases make `callMCP()` return the shared `JsonRpcResponse`. omp-kit does not call those APIs. The direct `@oh-my-pi/pi-coding-agent` dependency is nevertheless updated to 18.2.0 so extension/session-evidence typecheck and tests compile against the current SDK.
- **Stats path mismatch remains:** upstream `can1357/oh-my-pi#12060` is still open, and the 18.2.0 stats parser still derives `SessionSummary.folder` with the older `--` decoding logic. The collector must continue using public trace `cwd` for real-path matching.

No 18.2.0 change identified a need to alter agent frontmatter, the feedback authorization boundary, session-evidence storage ownership, or stable `agent://<id>` / `history://<id>` result retrieval. Deterministic CI against the 18.2.0 package tests source/type compatibility; it is not a new live-provider/runtime acceptance claim.

### Existing released-runtime acceptance

Feedback and collector acceptance remain claim-specific evidence from OMP 18.1.21. That testing exposed the stats representation mismatch:

```text
/api/sessions.folder   -> encoded session-storage key
/api/session/trace.cwd -> real project cwd
```

The collector uses public trace cwd for path filtering, with the upstream report `can1357/oh-my-pi#12060`. See [validation](VALIDATION.md) for exact evidence and retest limitations.

Historical #9521 preview experiments remain useful hardening evidence, not a current release blocker. #4 accepted feedback shared between Main/workers with bounded reporting consequences. Future scoping changes should be assessed on their actual benefit and impact.
