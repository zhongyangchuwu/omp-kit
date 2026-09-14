# Regression Evidence

## Goal

A debug task is complete when the original failing path is observed working and there is enough evidence to catch the same class of failure again.

## Evidence levels

Prefer the strongest practical evidence:

1. **Original path** — rerun the exact failing command, test, route, job, or user flow.
2. **Minimal reproduction** — add a focused test or script that fails before the fix and passes after.
3. **Boundary assertion** — test the component boundary where the bad state entered.
4. **Invariant test** — assert lifecycle, state, or contract rules that the root cause violated.
5. **Operational evidence** — logs, metrics, health checks, or manual observation when automation is not available.

## Record shape

A useful debug record contains:

- symptom;
- root cause;
- evidence that identified it;
- fix or mitigation;
- original failing path result after the change;
- regression check added or reason automation is not practical;
- remaining risk.

## Handoff to verification

After the root cause fix, verification owns final completion evidence. Hand off:

- claims that must now be true;
- commands or scenarios already run;
- logs or artifacts observed;
- branches and edge cases not yet checked;
- any mitigation that still needs cleanup.

## Do not claim done when

- only a narrowed reproduction passes but the original path was not rerun;
- the fix only suppresses the visible error;
- the failure disappeared without explanation;
- no check covers the boundary where the bad state entered;
- a mitigation remains but is described as a completed fix.
