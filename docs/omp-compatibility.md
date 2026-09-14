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

A changelog review is not a full runtime test. Existing smoke evidence remains relevant to its claim until that contract changes. Exact candidate CI belongs in Actions/PRs; accepted compatibility findings and limitations belong in current repository docs, with unresolved concrete problems in Issues.

## Recorded baseline

The existing 2026-09-14 review saw and triaged OMP 18.1.21. Its browser/Chromium changelog did not identify a change to the then-reviewed task/agent/plugin/extension/session surfaces. No generic smoke was required merely for that patch number.

Separate feedback/collector acceptance on 18.1.21 then exposed a stats representation mismatch:

```text
/api/sessions.folder   -> encoded session-storage key
/api/session/trace.cwd -> real project cwd
```

The collector uses public trace cwd for path filtering, with the upstream report `can1357/oh-my-pi#12060`. See [validation](VALIDATION.md) for exact evidence and retest limitations.

Historical #9521 preview experiments remain useful hardening evidence, not a current release blocker. #4 accepted feedback shared between Main/workers with bounded reporting consequences. Future scoping changes should be assessed on their actual benefit and impact.
