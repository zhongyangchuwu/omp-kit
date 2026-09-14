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
- per-agent tool activation, allowlists/denylists, mounted tools, extension tools, custom tools, MCP proxy tools, or capability enforcement;
- skill or rule discovery, visibility, activation, or invocation semantics;
- extension/custom-tool SDK contracts used by omp-kit;
- configuration, model-role, profile, or service-tier behavior relied on by omp-kit;
- session, trace, stats, RPC, persistence, or stable subagent output interfaces used as evidence or workflow primitives;
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

Raise the review depth whenever the changelog or source diff directly intersects an omp-kit compatibility surface.

For example, a patch release that changes task-agent `tools:` semantics, plugin discovery, extension loading, session RPCs, or the hard child capability boundary is not treated as a routine patch. It receives targeted source review and runtime verification appropriate to the affected contract.

Conversely, a minor release whose changes are demonstrably outside all omp-kit dependencies does not need unrelated full-system runtime testing merely because the middle version changed.

## Review flow

For each newly observed release:

1. Read the OMP release notes/changelog from the last triaged release through the new release.
2. Classify every relevant entry against the compatibility surfaces above.
3. Check directly tracked upstream blockers or contracts even if they are omitted from the release notes. In particular, Issue #4 requires checking whether the hard per-subagent tool boundary represented by upstream PR #9521, or an equivalent released implementation, has landed.
4. Choose the minimum sufficient verification level:
   - **triage only** — no relevant surface changed;
   - **targeted audit** — inspect the changed upstream contract and run focused released-runtime smoke when the claim depends on runtime behavior;
   - **full audit** — cover all runtime-facing omp-kit contracts after a major compatibility boundary or broad upstream change.
5. Modify omp-kit only if the accepted OMP contract actually requires a repository change.
6. Do not manufacture local tests, commits, or Issues for an unrelated upstream patch.

## Evidence and state

Keep release observation separate from runtime compatibility evidence. Current state should distinguish at least:

```text
latest upstream seen
latest changelog triaged
latest released-runtime compatibility evidence
```

Do not imply that a release was fully tested merely because its changelog was triaged.

Runtime evidence should be claim-specific. A previous compatible smoke remains useful until a later release changes the contract that smoke was proving; unrelated upstream changes do not automatically invalidate it.

GitHub Issues own unresolved concrete compatibility problems. Do not create a recurring Issue for every OMP release. `docs/WORKING_STATE.md` owns the current compact status, while this document owns the stable triage policy.

## Current baseline

As of 2026-09-14:

```text
latest upstream seen:     OMP 18.1.21
latest changelog triaged: OMP 18.1.21
18.1.21 disposition:      triage only; no omp-kit compatibility surface changed
```

OMP 18.1.21 contains Chromium/browser-automation fixes. Those changes do not alter the omp-kit runtime contracts listed above, so no dedicated compatibility smoke is required.

Issue #4 remains a direct-impact exception: upstream PR #9521 is still open and its hard per-subagent tool allowlist is not present in released OMP 18.1.21. Therefore PR #3 remains Draft until a supported release provides the required boundary and released-runtime smoke satisfies Issue #4's acceptance criteria.
