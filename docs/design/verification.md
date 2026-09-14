# Verification and acceptance

## Problem

Agent workflows can waste effort in two symmetric ways:

```text
insufficient verification
-> mechanical defects escape

ritual verification
-> equivalent full suites/reviews repeat across unchanged handoffs
-> extra tool turns, output, waiting and attention without new evidence
```

omp-kit needs evidence-driven acceptance without turning every worker handoff or phase boundary into another identical repository-wide test run.

## Evidence

### Mechanical evidence and judgment solve different problems

**Type:** engineering argument + project dogfood.

Deterministic checks falsify mechanical contracts such as tests, types, generated registries and repository consistency. Review is useful for semantics, lifecycle, product intent, security, ambiguity and cross-slice reasoning. Repeating either layer without changed state or a new question does not automatically add independence.

### Current gate is provider-free and CI-executable

**Type:** repository fact.

`just verify` is the repository-owned contract. It covers native-plugin/Skill/library Python tests, Skill-authoring tests, AutoDL mocked tests in its isolated environment, TypeScript typecheck/tests and registry freshness/validation. The obsolete installer validator and its exclusive tests are removed; this is not permission to discard tests for maintained Skills.

The #18 CI architecture remains:

- read-only repository permission, no project secrets;
- committed Python and Bun dependency graphs;
- the repository-owned gate instead of duplicate YAML test logic;
- changed-line and tracked-file drift checks;
- PR merge-ref pre-merge evidence and separate landed-main evidence.

Exact current candidate results live in Actions/PRs, not a self-invalidating Git-tracked latest-tested-SHA marker.

### Integrated acceptance ownership

**Type:** accepted project policy.

#6 established that scoped worker checks provide evidence while the combined tree needs explicit integration ownership. #9 later removed mechanical duplication across unchanged handoffs. Local effort is reserved for useful focused checks, CI diagnosis and genuinely installed-runtime/profile claims.

### Runtime boundaries

**Type:** project runtime audit.

The historical capability audit showed that prompt-described read-only intent is not a hard runtime boundary. The shared-feedback decision did not invalidate this finding:

- `sol-review` has a conservative review tool surface;
- remote-mutating GitHub operations remain Main-owned;
- feedback may be shared because it appends bounded evidence, not repository/policy/Issue changes;
- stronger runtime enforcement is necessary when the actual consequence calls for that boundary.

### Cleanup must preserve the requirement

**Type:** user correction / review finding.

A previous green cleanup candidate removed maintained Skills and accepted design/evidence assets even though the user intended historical-maintenance cleanup. Its passing tests did not validate that scope interpretation. Restoration and narrower consumer-based cleanup are required; fewer files are not a quality metric by themselves.

## Interpretation

```text
focused implementation evidence
  -> scoped behavior and regressions

integrated deterministic CI
  -> current candidate/landed-tree mechanical contracts

semantic review
  -> intent, lifecycle, product, security and cross-slice judgment

external read-back
  -> observed result of operations against external state

released/local runtime evidence
  -> claims depending on the actual OMP/profile/machine
```

The objective is **minimum evidence duplication at the same acceptance strength**, not minimum testing. Nor is it the smallest product surface regardless of the user's needs.

## Design principle

> Prefer the cheapest evidence that can falsify the relevant failure mode. Do not collect the same evidence twice unless state or question changed.

Once the relevant tree changes, an earlier pass may be stale. Before it changes, rerunning solely because a phase or owner changed usually adds little. Review should challenge assumptions not established by a clean test result.

## Current mechanism

```text
implementation/debugging -> focused checks
related writes settle -> reconcile scopes and shared consumers
current candidate -> semantic review + PR merge-ref CI
relevant repair -> new candidate and appropriate new checks
authorized merge -> landed-main gate
```

### Worker-local gate

Focused checks are the default. A worker full gate can be useful for an isolated exact final tree, risky pre-merge safety, cross-slice diagnosis, explicit Main request or CI debugging. On a changing shared tree, a worker pass may describe a transient state and cannot automatically establish final acceptance.

### Integrated gate

GitHub Actions is the normal broad mechanical acceptance point. A successful PR merge-ref run is pre-merge evidence; post-merge `main` CI answers the distinct landed-tree question. Local `just verify` remains useful, not a mandatory duplicate.

Keep the verification implementation in the repository gate. A maintained integration can use an isolated environment and mocked tests without turning CI into a live-service acceptance campaign.

### Strong review

Independent review is selective by failure cost, ambiguity and expected value. Review actual current diffs and accepted constraints. Known v0 examples include stale WORKING_STATE text caught before #22, fresh post-base-change CI for #3, and a clean collector-only diff before #23 acceptance.

User-approved knowledge and personal Skill conventions are part of scope. An unrelated/general Skill is not necessarily obsolete. A design/evidence document can have an important consumer without being loaded by the runtime.

### External or expensive verification

Metered, destructive, slow or machine-specific claims need a proportionate plan. CI cannot prove a cloud resource was stopped, a document was not uploaded, or every local OMP installation topology works. Use appropriate read-back, previews, idempotency and runtime evidence.

## Evaluation / observed effect

The architecture automates mechanical checks while retaining semantics/runtime boundaries. During earlier landing, `setup-just` received HTTP 504 responses before tests ran; unchanged retries passed. Distinguish environment/setup failures from actual test failures rather than making arbitrary code changes or declaring success prematurely.

The documentation cleanup restores test coverage for retained library tools rather than using deletion to make the suite simpler. It also makes the accepted knowledge available offline, without treating discussion records as the only product contract.

## Counter-evidence and limits

- Worker-local broad checks can be valuable for a distinct risk.
- CI only proves covered properties; it is not proof of user intent or overall usability.
- High-consequence claims may need E2E/manual/external checks.
- Avoiding duplication never justifies missing/failed current-candidate checks.
- Hosted Linux is not every supported local platform/profile.
- A successful retry is reusable only when the candidate is unchanged and failure was understood.
- Restoring a Skill does not certify every live external dependency it describes.

## Current status

**Accepted verification architecture.** #9's systematic behavior/scaffolding audit remains unfinished. Document/library maintenance does not replace its real-session evidence.

## Related

- [Workflows](../workflows.md), [validation](../VALIDATION.md)
- [CI](../../.github/workflows/verify.yml)
- [OMP workflow](../../skills/omp-workflow/SKILL.md)
- [Execution](../../skills/omp-workflow/references/execution.md)
- [Delegation](../../skills/omp-workflow/references/delegation.md)
- #4 shared feedback; #6 integration; #8 economics; #9 ablation; #18 CI; #26 documentation cleanup.

## Revisit triggers

Repeated missed regressions, CI/runtime divergence, new platforms, flaky checks, redundant reviews, stronger runtime capability enforcement or important external-state failures justify revisiting the smallest affected part of this policy.
