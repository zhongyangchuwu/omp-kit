# Design records

This directory explains **why each meaningful omp-kit mechanism exists, what evidence supports it, what has actually been observed, and when it should be reconsidered**.

It is intentionally not one large philosophy document. `../design-foundations.md` is the short project-level summary; files here are mechanism-level evidence records. Accepted rationale travels with the checkout and is not delegated entirely to Issues.

## Record contract

A design record should normally contain:

```text
Problem
Evidence
Interpretation
Design principle
Current mechanism
Evaluation / observed effect
Counter-evidence and limits
Current status
Related implementation / Issues
Revisit triggers
```

Not every heading must be equally long. The important constraint is that a design cannot silently jump from `we like this idea` to `this is current policy` without showing the problem and evidence chain.

## Evidence vocabulary

Use plain categories rather than a fake numeric confidence score.

| Evidence type | Meaning |
| --- | --- |
| `repository/runtime fact` | Directly observable current code, configuration, or runtime behavior. |
| `controlled experiment` | Deliberately compared conditions with a defined acceptance/scoring method. |
| `dogfood` | Observation from real repository work using omp-kit/OMP. |
| `source inspection` | Conclusion grounded in inspected OMP/project source or public contracts. |
| `first-party benchmark` | Benchmark published by the implementation/project being discussed; useful but not automatically universal. |
| `community report` | Concrete report from another user/project with useful mechanics but limited generalizability. |
| `anecdote / hypothesis` | Plausible design input without enough evidence to treat as established. |
| `counter-evidence` | Observation that limits, contradicts, or narrows a design claim. |

Always preserve material limitations. A one-user trace is not a universal cost ratio. A personal bake-off is not a public benchmark. A preview branch is not a released-runtime compatibility guarantee.

## Persistence rule

```text
accepted rationale/evidence      -> docs/design/*.md
unresolved question/experiment   -> GitHub Issue
chronological experiment updates -> Issue comments
implementation/review            -> Pull Request
routine session observations     -> local session-evidence store
material durable experiment      -> evidence/experiments/
superseded phase chronology      -> Git and Issue/PR history
```

If a record names an open question that could change implementation or policy, link its Issue. When resolved, promote the durable conclusion into current docs; preserve evidence limitations. Removing duplicate archive copies does not justify deleting the design records or compact experiments themselves.

## Current records

| Record | Current status | Persistent work |
| --- | --- | --- |
| [Harness boundary](harness-boundary.md) | accepted boundary principle; systematic audit not yet run | #9 later scaffolding ablation; #5/#8 evidence |
| [Delegation](delegation.md) | accepted routing shape; economics evolving | #8 delegation economics; #5 worker tools |
| [Verification](verification.md) | accepted CI/review/runtime evidence architecture | #9 later process ablation |
| [Supervision](supervision.md) | accepted local policy; runtime semantics remain OMP-owned | #7 coordination gaps |
| [Context authority](context-authority.md) | accepted authority/provenance policy | #11 project-state dogfood |

## Coverage and boundaries

Worker capability conclusions (#5), routing economics (#8), and project-state experience (#11) should update the relevant existing record when accepted. Split a new mechanism-level record only when it provides a useful independent explanation, not to fill an architecture checklist.

Shared feedback (#4) is bounded qualitative evidence, not mutation authority. Routine session collection (#21) is documented in [session evidence](../session-evidence.md). These do not require duplicate dedicated records until their accepted design needs a separate explanation.

Keep useful personal Skill knowledge as maintained resources. Repository cleanup is not an experiment proving that code-taste, product design or specialized planning guidance is unnecessary. #9 owns systematic behavioral analysis and remains unfinished.

## Source discipline

External articles and community projects are design inputs, not automatically project truth. Label their evidence type, link the source and preserve counterarguments. Re-check source claims before strengthening them.

Existing inputs include:

- OMP Hashline/edit contract and first-party benchmark material: https://github.com/can1357/oh-my-pi
- Strong-model Harness discussion: https://www.iconb.cn/article/0eec42eaeef142c5df5c5e1f88864592
- Doug Colkitt discussion mirror: https://zamantika.com/0xShual/status/2096440481630585128
- Maker Jackie usage notes: https://www.makerjackie.com/blog/2026-09-07-gpt6-astra
- LINUX DO wait/subagent discussion: https://linux.do/t/topic/2894195
