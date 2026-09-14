# OMP compatibility policy

OMP moves quickly. omp-kit should track the runtime contracts it depends on, not mechanically retest every upstream release.

## Principle

Treat the OMP version number as a default risk signal, not as compatibility evidence.

Every new release starts with a changelog triage. The declared version delta determines the default review depth; the actual changed surfaces can raise that depth when they intersect omp-kit assumptions.

```text
version number -> default review depth
changelog/source impact -> escalation override
runtime evidence -> compatibility claim
```

A patch release may still contain added or changed behavior, so `x.y.z` alone never proves that a release is irrelevant.

## Compatibility surfaces

Escalate when an OMP change touches a contract omp-kit relies on, especially:

- plugin installation, linking, package-root discovery, or sibling capability discovery;
- task-agent discovery, agent frontmatter, model resolution, task lifecycle, or subagent protocol behavior;
- per-agent tool activation, allowlists/denylists, mounted tools, extension/custom/MCP tools, or capability enforcement;
- skill or rule discovery, visibility, activation, or invocation semantics;
- extension/custom-tool SDK contracts used by omp-kit;
- configuration, model-role, profile, or service-tier behavior relied on by omp-kit;
- session, trace, stats, RPC, persistence, or stable subagent output interfaces used as evidence/workflow primitives;
- assumptions required by the legacy installer or compatibility snapshot.

Changes limited to unrelated OMP-owned surfaces such as TUI presentation, browser automation, providers, or editor integrations do not require omp-kit compatibility work unless omp-kit has an explicit dependency on the changed contract.

## Default review depth

| Version change | Default action |
| --- | --- |
| `x.y.z -> x.y.(z+1)` | Read the release changelog. If no compatibility surface is touched, record triage only; do not run compatibility tests. |
| `x.y -> x.(y+1)` | Read the changelog, inspect affected upstream contracts/source for relevant surfaces, and test the affected omp-kit behavior on a released runtime when needed. |
| `x -> (x+1)` | Perform a full compatibility audit across omp-kit runtime-facing contracts and execute the appropriate released-runtime test set. |

These are defaults, not ceilings.

## Impact override

Raise review depth whenever changelog/source evidence intersects an omp-kit compatibility surface.

For example, a patch release that changes task-agent `tools:` semantics, plugin discovery, extension loading, session/stats APIs, or a hard per-agent capability boundary is not treated as a routine patch. It receives targeted source review and runtime verification appropriate to the affected contract.

Conversely, a minor release whose changes are demonstrably outside all omp-kit dependencies does not need unrelated full-system runtime testing merely because the middle version changed.

## Review flow

For each newly observed release:

1. Read OMP release notes/changelog from the last triaged release through the new release.
2. Classify relevant entries against the compatibility surfaces above.
3. Check any concrete upstream Issues/PRs that currently shape an omp-kit contract, even when omitted from release notes.
4. Choose the minimum sufficient verification level:
   - **triage only** — no relevant surface changed;
   - **targeted audit** — inspect the changed upstream contract and run a focused released-runtime smoke when the claim depends on behavior;
   - **full audit** — cover all runtime-facing omp-kit contracts after a major compatibility boundary or broad upstream change.
5. Modify omp-kit only if the accepted OMP contract actually requires a repository change.
6. Do not manufacture local tests, bookkeeping commits, or generic release-tracking Issues for an unrelated patch.

Future hardening such as a supported per-subagent custom/extension/MCP tool allowlist should be evaluated when it lands, but it is not automatically a release blocker for bounded evidence-only tools. The consequence of the capability matters.

## Evidence and state

Keep release observation separate from runtime compatibility evidence. Current state should distinguish at least:

```text
latest upstream seen
latest changelog triaged
claim-specific released-runtime evidence
```

Do not imply that a release was fully tested merely because its changelog was triaged.

Runtime evidence is claim-specific. A previous compatible smoke remains useful until a later release changes the contract that smoke was proving; unrelated upstream changes do not automatically invalidate it.

GitHub Issues own unresolved concrete compatibility problems. Do not create a recurring Issue for every OMP release. `docs/WORKING_STATE.md` owns the compact current status; this document owns the stable triage policy.

## Current baseline

As of 2026-09-14:

```text
latest upstream seen:     OMP 18.1.21
latest changelog triaged: OMP 18.1.21
18.1.21 changelog impact: browser/Chromium-only for the previously owned compatibility surfaces
v0 runtime evidence:      shared feedback + session-evidence behavior accepted on OMP 18.1.21
```

OMP 18.1.21's release changelog did not change the task/agent/plugin/extension/session contracts then under review, so no generic compatibility test was required solely because 18.1.21 existed.

Later claim-specific runtime acceptance did exercise omp-kit feedback/session-evidence behavior on 18.1.21 and found one stats representation mismatch:

```text
/api/sessions.folder   -> encoded session-storage key
/api/session/trace.cwd -> real project cwd
```

omp-kit adapted by using the public trace cwd for filesystem-path filtering and reported the upstream mismatch as `can1357/oh-my-pi#12060`. This illustrates why changelog triage and runtime evidence are separate layers: a relevant interaction can still be discovered while testing a concrete product claim even when the release changelog did not advertise a change to that surface.

Historical upstream PR #9521 remains useful capability-hardening evidence. It is no longer an omp-kit release blocker because completed Issue #4 accepted shared feedback as a bounded evidence sink for Main/workers rather than an authority-bearing Main-only tool. If OMP later releases stronger per-agent scoping, reassess whether narrower feedback exposure provides enough benefit to justify a change.
