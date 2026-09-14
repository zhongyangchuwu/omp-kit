# OMP compatibility policy

OMP moves quickly. OMP Kit tracks the runtime contracts it actually depends on rather than mechanically retesting every release.

## Principle

```text
version delta -> default review depth
changed surface -> escalation override
runtime evidence -> compatibility claim
```

A version number is a risk signal, not proof of compatibility or incompatibility.

## Current compatibility surfaces

Escalate when OMP changes a contract used by the core package, especially:

- plugin linking/package-root and sibling resource discovery;
- custom-agent discovery/frontmatter/model inheritance/task lifecycle;
- per-agent tools, extension/custom-tool mounting or capability enforcement;
- Skill/rule discovery and activation;
- extension SDK behavior used by `feedback.ts`;
- session/stats/trace APIs used by session evidence;
- stable subagent output/transcript behavior used by workflow/review.

Unrelated browser/TUI/provider/editor changes do not require an omp-kit compatibility run unless a current core contract actually depends on them.

## Default review depth

| Upstream change | Default action |
| --- | --- |
| patch | Read changelog; stop if no core compatibility surface changed. |
| minor | Changelog + relevant source/contract review; targeted released-runtime smoke when needed. |
| major | Full core compatibility audit and appropriate released-runtime test set. |

Any direct-impact change raises the depth regardless of version number.

## Review flow

1. Read release notes/changelog since the last triaged release.
2. Map changes only to current core compatibility surfaces.
3. Choose the minimum sufficient verification: triage only, targeted audit/smoke, or full audit.
4. Modify OMP Kit only if the released/public OMP contract actually requires it.
5. Open a local Issue only for a concrete independently decidable incompatibility.
6. Do not create bookkeeping commits or tests for unrelated upstream changes.

Keep these states distinct:

```text
latest upstream seen
latest changelog triaged
latest claim-specific released-runtime evidence
```

## Current baseline

As of 2026-09-14:

```text
latest upstream seen:       OMP 18.1.21
latest changelog triaged:   OMP 18.1.21
feedback runtime evidence:  OMP 18.1.21
session-evidence runtime:   OMP 18.1.21
```

OMP 18.1.21's general release changes were browser/Chromium-oriented and did not require a broad omp-kit compatibility run. Separate claim-specific runtime work verified the shared feedback and session-evidence surfaces.

The session-evidence work found an OMP stats folder/cwd representation mismatch tracked as `can1357/oh-my-pi#12060`. OMP Kit adapts at its public API boundary by preferring trace `cwd`; it does not reproduce OMP internal storage-key encoding.

Historical capability-isolation experiments remain history, not current blockers. Future hard runtime boundaries are evaluated when a current core capability actually requires them.
