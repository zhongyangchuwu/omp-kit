# OMP compatibility

These dated reviews preserve earlier runtime/API compatibility evidence. The OMP SDK/stats dependencies and session integration described below were retired from omp-kit; their former consumers are historical, not current package pins or capabilities.

## Historical OMP 18.20.0 / Bun 1.4.4 compatibility review — 2026-11-13

**Reviewed:** 2026-11-13. At that time, the installed OMP CLI and coding-agent/stats dependencies reported 18.20.0; Bun package manager/types and CI used 1.4.4. The SDK/stats dependencies have since been removed, so these versions are historical compatibility evidence, not a current OMP compatibility target.

The [coding-agent changelog](https://github.com/can1357/oh-my-pi/blob/v18.20.0/packages/coding-agent/CHANGELOG.md), its archived 18.12 entries and the [stats changelog](https://github.com/can1357/oh-my-pi/blob/v18.20.0/packages/stats/CHANGELOG.md) were mapped to consumers maintained at the time:

- **Runtime and dependencies:** at that release, coding-agent and stats required Bun 1.4.4 or newer. The then-consumed extension identity, read-only session and stats trace/entry interfaces remained available; no kit-owned journal parser or scheduler was introduced.
- **Routing and supervision:** `task.perCallModel` restores restricted, operator-authorized per-call model selection, off by default. Direct-message replies can be waited on in addition to owned jobs/services; use the live wait contract, not historical 18.11.0 restrictions. Existing agent roles and conservative reviewer capability boundaries remain unchanged.
- **Removed interfaces:** the kit does not use the removed `taskFile`, blocked todo or eval `display()` interfaces, nor the replaced custom session-storage method. New `ask` and browser signatures are runtime-owned rather than copied into kit code.
- **Stats and evidence:** stats catalog synchronization and pricing fixes remained upstream-owned. At the time, the collector waited for completed sync and retained trace-recorded cost, not quota or catalog re-pricing.
- **Discovery:** new or installed Skills can be discovered within an active session. This does not establish automatic reload of every changed resource.

[Validation](VALIDATION.md) records provider-free checks and their limits. In particular, extension loading and child lifecycle in a real worker-thread subagent remain unverified.

## OMP 18.11.0 / Bun 1.4.2 compatibility review

**Reviewed:** 2026-10-15. **Previous OMP baseline:** 18.8.0. At that review the exact pins were coding-agent/stats 18.11.0, Bun package manager/types and CI 1.4.2, and TypeScript 5.9.3. The installed CLI and npm stable packages then reported 18.11.0, matching the [published release](https://github.com/can1357/oh-my-pi/releases/tag/v18.11.0). SDK installation does not upgrade the separate executable.

The [coding-agent changelog](https://github.com/can1357/oh-my-pi/blob/v18.11.0/packages/coding-agent/CHANGELOG.md), [stats changelog](https://github.com/can1357/oh-my-pi/blob/v18.11.0/packages/stats/CHANGELOG.md) and released task settings/source were mapped to maintained consumers:

- **Subagent routing:** 18.8.2 removed per-call `model` from `task`, eval `agent()` and workpool. Current configuration, workflow and delegation guidance now use named agents, native presets and machine-owned agent overrides. All four maintained role bindings stay unchanged; no routing shim or personal-config rewrite is added.
- **Task completion:** 18.10.2 defaults ordinary tasks to final-response text; 18.11.0 adds agent-level `structured: true` alongside `task.structured`. Eval agent/workpool completion remains structured. The [native setting](https://github.com/can1357/oh-my-pi/blob/v18.11.0/packages/coding-agent/src/task/settings.ts) and dynamic schema were checked directly rather than relying on older task-documentation yield instructions. The kit does not force structured mode.
- **Permission/discovery boundaries:** transport-only `write` now permits `local://` scratch artifacts without granting working-tree writes or outbound agent messaging. Released fixes also make malformed explicit tool lists deny built-ins and prevent discovery from unrelated shared temporary roots. They are native improvements, not a complete MCP/extension sandbox; reviewer LSP and #7 remain separate work.
- **Public SDK/session contracts:** the then-consumed root extension exports, agent identity, read-only getters and public stats trace/selected-entry interfaces were compatible. New optional per-entry writer-build provenance survived the runtime snapshot. `agent_end.awaitingAsyncWork`, crash recovery through `omp --restore`, anonymized diagnostic export and session transport remain OMP-owned; no kit journal parser, scheduler or recovery adapter was introduced.
- **Stats and model work:** upstream fixes scheduled-price estimation and subscription-window grouping. The then-existing collector retained its trace-cost metric and completed-sync-before-listing contract; neither quota reconciliation nor a new pricing layer was added. Native compression-cache, fallback, prompt-cache, browser and UI improvements are not evidence of provider savings or broad runtime acceptance.
- **Removed mechanisms:** the kit has no consumer of `PI_SUBPROCESS_CMD` or the removed Codex Code Mode settings. Machine-owned configuration and optional native account pools, budgets and worktrees remain outside the plugin.

[Validation](VALIDATION.md) records the checks and their original limits. This and later historical reviews are not current task/model instructions or renewed runtime acceptance.

## OMP 18.8.0 / Bun 1.4.2 compatibility review

**Reviewed:** 2026-10-07. **Previous OMP baseline:** 18.6.1. **Current exact pins:** coding-agent/stats 18.8.0, Bun package manager/types and CI 1.4.2. Updating SDK dependencies does not update the separate `omp` executable.

The [coding-agent changelog](https://github.com/can1357/oh-my-pi/blob/v18.8.0/packages/coding-agent/CHANGELOG.md) and [stats changelog](https://github.com/can1357/oh-my-pi/blob/v18.8.0/packages/stats/CHANGELOG.md) identify these changes relevant to maintained integration:

- **Saved-model resume:** 18.6.3 makes saved-model restore failures explicit rather than silently falling back. An intentional model change belongs to OMP's explicit native model override; headless resume must not turn a failed restore into an implicit route change. omp-kit does not resume or switch SDK sessions.
- **Native completion and interaction:** OMP owns the wait-completion correctness fixes and its native JSON query, visual rendering and title-generation mechanisms. omp-kit does not reimplement these features or copy their instructions into its prompts.
- **Model ownership:** native title generation may use the session model; startup is not guaranteed to be tiny-model-only or zero-model-work. Model choice and availability remain OMP/environment-owned.
- **Consumed contracts:** the root extension exports, agent identity, read-only session getters and published stats trace/summary shapes remain compatible by released-source audit. Native stats still owns sync, trace memoization and HTTP caching; no kit adapter, cache or storage migration is needed.
- **Evidence boundary:** source/type checks and native fixture smoke cover the exercised contracts only; [validation](VALIDATION.md) records their scope. They do not establish live-provider routing, private-session recovery, concurrent child-trace cache freshness or UI visuals.

The prior 18.6.1 review below is retained as historical evidence and is not an 18.8.0 runtime acceptance claim.

## OMP 18.6.1 / Bun 1.4.2 compatibility review

**Reviewed:** 2026-10-06. **Previous OMP baseline:** 18.4.2. **Current exact pins:** coding-agent/stats 18.6.1, Bun package manager/types and CI 1.4.2. Updating dependencies does not update the separate `omp` executable.

The intervening [released changelogs](https://github.com/can1357/oh-my-pi/blob/v18.6.1/packages/coding-agent/CHANGELOG.md) were mapped to maintained consumers:

- **Extensions/session access:** the consumed root SDK exports, `ReadonlySessionManager` entry reads and agent identity fields remain compatible. Public `omp-stats/trace` and `shared-types` still provide the consumed trace/selected-entry contracts; no adapter shim or raw-journal parser is needed.
- **Native supervision:** `wait` now requires the caller's own background jobs/services; an empty or peer-only wait is an error. Native progress, completion estimates and follow-up job settlement replace copied wait ladders and fixed checkpoint schedules. Main still decides intervention on observed errors, blockers or stagnation. No local scheduler/message bus is introduced.
- **Model/history ownership:** native role aliases, model presets and per-task selectors own routing mechanics; `archive` owns cross-session history retrieval and `/dump all` owns complete transcript diagnostics. Same-session `history://` remains an evidence source, not a durable project-state dependency.
- **Prompt ownership:** the Main-only rule activates `omp-workflow`; detailed policy lives in on-demand references. Verification has one owner in `references/execution.md`: workers supply scoped changes and verification targets, while Main runs checks after coordinated edits settle. Repeated tool schemas, timing guidance, authority lists and worker-local check obligations were removed. The always-on rule is 950 → 288 characters including frontmatter; this is a text-size measurement, not a provider-token or quota claim.
- **Skills:** native namespaced collisions remove any need for a kit-level activation/collision registry. All maintained experience Skills, design records and compact experiment assets remain in place. Prose-pinning tests were deleted instead of re-pinning shortened instructions; native shape and link contracts remain checked.
- **Breaking changes:** the kit does not use the removed bash `env` argument, replaced custom storage ownership methods or removed TUI components. Old `task.completionProbeMs` configurations are OMP's migration responsibility, not a kit configuration rewrite. Reviewer LSP remains conservative: restricted SDK-session defaults are not proof of ordinary per-agent read-only enforcement.
- **Stats/cost:** completed catalog sync still precedes listing. Evidence totals retain trace-recorded usage cost; native catalog re-pricing may yield different totals. This upgrade does not change that metric or add billing/quota reconciliation.

Claim-specific checks and limits are recorded in [validation](VALIDATION.md). Historical reviews below retain their original runtime scope; they are not current wait/API instructions.

## OMP 18.4.2 compatibility review

**Reviewed:** 2026-09-28. **Exact package pin and installed runtime:** 18.4.2.

The released 18.3.3–18.4.2 changelogs and affected public contracts were
reviewed before moving the pin:

- **Stats catalog:** `/api/sync` accepted POST and returned 202 after queuing background ingestion. The then-current session-evidence collector waited for `/api/status` to report a successful sync before listing sessions. A bounded timeout, caller abort, invalid status or sync error remained an unavailable read, not empty history. The in-process trace and selected-entry interfaces used their public exports and the consumed shapes had not changed.
- **Supervision:** 18.4.0 restored the old adaptive 5s/10s/30s/60s/5m window
  **only** when a `wait` has live peers but no owned job or service. Owned-job
  and service waits retain the 30-minute safety cap. The released wait source
  and fix [#13516](https://github.com/can1357/oh-my-pi/pull/13516) clarify this
  distinction; the 18.4.2 `docs/tools/wait.md` text still describes the older
  no-ladder behavior. Neither path filters peer messages by workflow kind.
- **Delegation:** `task` replaced its brief's `complexity` field with
  `solutionSpace`; omp-kit declares no `complexity` payload, and the current
  tool schema supplies the new field. 18.4.2 isolates task/Vibe eval kernels
  per agent instead of sharing parent eval state.
- **Other changes:** improved subagent settlement, rules on eval-nested tool
  calls, native resource handling and stats storage reliability do not require
  a second scheduler, storage layer or local config mirror.

The repository gate checks the candidate source/package contract; it does not
prove a live model session, private profile, or every stats history size.
Previous compatibility reviews below retain their release-specific limits.

## OMP 18.3.2 compatibility review

**Reviewed:** 2026-09-26. **Exact dependency and installed runtime:** 18.3.2.

Released changes since the previous 18.2.5 review were mapped to omp-kit's
maintained integration surfaces:

- **Coordination:** 18.3.0 deprecated `hub` in favor of event-driven `wait`,
  non-consuming `read proc://` status and `write agent://<id>` messages. The
  current `wait` has no adaptive polling ladder or per-call timeout; a silent
  worker can remain blocked until its 30-minute safety cap. Task-shape
  checkpoints in the delegation guide are expectations at natural wakeups,
  not scheduled runtime checks.
- **Feedback:** 18.3.2 exposes `ctx.agent.kind`, registry `id`, definition
  `name`, task `depth` and optional `parentId`. Preserve kind and id to
  distinguish sibling workers and depth-zero clones; session id/file remain
  separate provenance.

The package pin and installed runtime being equal does not establish every
runtime-facing behavior. Focused regressions and source/type checks cover
their specified cases; plugin discovery and real session behavior require
their own observation. The prior 18.2.5 findings below remain historical.

## OMP 18.2.5 compatibility review

**Reviewed:** 2026-09-18. **Candidate pin:** 18.2.5.

The 18.2.4/18.2.5 released changelogs and current package surface were reviewed before changing the local pin.

- **Package surface:** OMP 18.2.5 moves terminal-UI subpaths out of `@oh-my-pi/pi-coding-agent` into `@oh-my-pi/pi-tui`. omp-kit imports only the coding-agent package root plus public `@oh-my-pi/omp-stats` surfaces, so the removed TUI subpaths are not used locally.
- **Stats/session access:** at the time, `@oh-my-pi/omp-stats` 18.2.5 documented session/fork polling performance work and made `SessionTrace.etag` part of the required public trace shape. The then-current kit validated that field at its access boundary but did not otherwise consume it. The 18.2.1 real-working-directory fix was the folder contract for that collector.
- **Subagent lifecycle:** 18.2.5 fixes subagents that could spend a run on incremental `yield` calls and makes the forced final yield terminate the run. It also fixes queued parent messages left behind after tool interruptions and adjusts parent IRC interruption prompts.

Repository CI against the 18.2.5 candidate pin establishes source/type/test compatibility only. It does not substitute for installed-runtime dogfood of background/subagent settlement.

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
- historical extension SDK contracts used by the retired feedback tool;
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

Stronger per-agent capability scoping may be useful hardening, but the retired bounded feedback append was not equivalent to authority-bearing mutation. Evaluate consequences instead of reintroducing the old Main-only feedback release blocker automatically.

## Evidence and state

Distinguish:

```text
latest upstream seen
latest changelog triaged
claim-specific released-runtime evidence
```

A changelog/source review is not a full runtime test. Existing smoke evidence remains relevant to its claim until that contract changes. Exact candidate CI belongs in Actions/PRs; accepted compatibility findings and limitations belong in current repository docs, with unresolved concrete problems in Issues.

## Recorded baseline

### OMP 18.2.3 triage — 2026-09-17

OMP 18.2.3 was the previous exact dependency for omp-kit. This historical review covered 18.2.1–18.2.3 and the released stats/session source used by the then-current session-evidence collector before the later 18.2.5 pin.

Relevant findings:

- **Session folder contract repaired:** 18.2.1 fixed `/api/sessions` so `SessionSummary.folder` was the real working directory instead of an encoded storage key. At the time, the session-evidence collector applied `--folder` before trace reads; the old trace-`cwd` filtering workaround had been retired.
- **Tool-error evidence improved:** 18.2.1 preserves non-throwing tool failure status through extension result rewrites and eval-defined subagent tools. Historical pre-18.2.1 error counts remain useful samples but are not directly comparable to current-runtime coverage.
- **Background/subagent terminal semantics changed:** 18.2.2 settles stopped-subagent parent jobs correctly and adjusts consumed/recovered background-job retention; 18.2.3 keeps cancelled jobs tracked until execution actually finishes. Historical findings therefore retain runtime-version context; samples from before 18.2.2 are not directly comparable to the later contract.
- **Selected-entry bulk access remained single-entry:** 18.2.3 serves `/api/session/entry` through a single-entry lookup over the transcript.
- **No maintained contract break found:** at the time, agent frontmatter, native plugin installation, feedback provenance, public session trace and selected-entry shapes, and stable result/history retrieval remained compatible.

The former 18.2.3 exact pin was validated by the repository deterministic gate. This source/type compatibility evidence is separate from historical full-scan timing and from later 18.2.5 runtime dogfood.

### OMP 18.2.0 triage — 2026-09-15

OMP 18.2.0 was the previous released baseline inspected for omp-kit contracts. The review covered changes since 18.1.21 and the relevant released source.

Relevant findings:

- **Native install path:** `omp install <target>` is a real top-level command. Local filesystem targets route to the plugin link flow, so `omp install .` is appropriate for omp-kit's long-lived editable checkout. Git specs continue through managed plugin installation. The development install docs and `just install` now use this public path.
- **Hub waiting:** 18.1.22 removed the caller `timeoutMs` argument and `async.pollWaitDuration`; waits now use an OMP-owned adaptive window beginning around 5 seconds and lengthening across consecutive waits to about 5 minutes. 18.2.0 also improves process-wait timeout diagnostics. omp-kit's delegation guidance no longer invents the removed timeout control.
- **Remaining supervision gap:** current `hub wait` still lets a matching peer message win the wait before job settlement. There is still no general progress/blocker/decision/final message kind for completion-relevant filtering, so Issue #7 remains unresolved rather than spawning a local scheduler/message layer.
- **Skill UX:** `/skill:<name>` is now represented as an atomic composer chip and user-invoked skill prompts participate more consistently in rewind/tree/copy behavior. This changes interaction/rendering, not the native Skill discovery contract omp-kit relies on.
- **SDK breaking changes:** `Settings.getGroup()` returned shallow-frozen snapshots; removed MCP response aliases made `callMCP()` return the shared `JsonRpcResponse`. omp-kit did not call those APIs. The direct `@oh-my-pi/pi-coding-agent` dependency was updated to 18.2.0 so then-current extension/session-evidence typecheck and tests compiled against that SDK before later pins.
- **Historical stats path mismatch:** the 18.2.0 stats parser derived `SessionSummary.folder` with the older `--` decoding logic, so the then-current collector had to use public trace `cwd` for real-path matching. OMP 18.2.1 fixed that contract; the collector no longer needed the workaround afterward.

At the time, no 18.2.0 change required altering agent frontmatter, the feedback authorization boundary, session-evidence storage ownership, or stable `agent://<id>` / `history://<id>` result retrieval. The feedback and evidence integrations have since been retired; deterministic CI against the 18.2.0 package tested source/type compatibility, not live-provider/runtime acceptance.

### Existing released-runtime acceptance

Feedback and collector acceptance are historical, claim-specific evidence from OMP 18.1.21. That testing exposed the stats representation mismatch:

```text
/api/sessions.folder   -> encoded session-storage key
/api/session/trace.cwd -> real project cwd
```

That historical mismatch was fixed in OMP 18.2.1. On the then-pinned 18.2.5 baseline, the collector used `SessionSummary.folder` for pre-trace path filtering; trace `cwd` remained evidence metadata rather than the folder-filter workaround. See [validation](VALIDATION.md) for the older acceptance evidence and its historical limitation.

Historical #9521 preview experiments remain useful hardening evidence, not a current release blocker. #4 accepted bounded feedback sharing between Main/workers at the time; that tool is retired. Future scoping changes should be assessed on their actual benefit and impact.
