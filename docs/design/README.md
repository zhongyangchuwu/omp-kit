# Design records

This directory explains **why each meaningful omp-kit mechanism exists, what evidence supports it, what has actually been observed, and when it should be reconsidered**.

It is intentionally not one large philosophy document. `../design-foundations.md` is the short project-level summary; files here are mechanism-level evidence records.

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

Unresolved design work must not exist only in a chat transcript or model memory.

Use this routing rule:

```text
accepted rationale/evidence      -> docs/design/*.md
unresolved question/experiment   -> GitHub Issue
chronological experiment updates -> Issue comments
implementation/review            -> Pull Request
routine session observations     -> local session-evidence store
material durable experiment      -> evidence/experiments/
old phase-specific long evidence -> docs/archive/ when local history is useful
```

If a design record names an open question that could change implementation or policy, link to an Issue with a closure/reactivation condition. When that Issue resolves, promote only the durable conclusion back into current docs; preserve history rather than rewriting it.

## Current records

| Record | Current status | Persistent work |
| --- | --- | --- |
| [`harness-boundary.md`](harness-boundary.md) | accepted boundary principle; systematic audit not yet run | #9 later scaffolding ablation; #5/#8 evidence |
| [`delegation.md`](delegation.md) | accepted routing shape; economics evolving | #8 delegation economics; #5 worker tools |
| [`verification.md`](verification.md) | accepted CI/review/runtime evidence architecture | #9 later process ablation |
| [`supervision.md`](supervision.md) | accepted local policy; some runtime semantics remain upstream-owned | #7 OMP coordination gaps |
| [`context-authority.md`](context-authority.md) | accepted authority/provenance policy | #11 project-state dogfood |

## Coverage backlog

The following topics are real but do not necessarily need a dedicated design record yet. Their unresolved state belongs in Issues, not model memory:

- **Worker capability surface** — Issue #5. Future durable conclusions should explain why capabilities remain, what their consequence is, and which enforcement belongs to OMP.
- **Model routing / delegation economics** — Issue #8. Currently lives primarily in `delegation.md`; split only if evidence becomes large enough to justify another mechanism-level record.
- **Issue-centered project state** — Issue #11. V1 is implemented; a dedicated design record is warranted only if natural dogfood produces durable rationale beyond the workflow reference/current context-authority record.
- **Structured self-hosting feedback** — completed Issue #4 established the v0 product: bounded qualitative evidence may be recorded by Main/workers and never implies authorization/self-modification. Add a dedicated record only if future lifecycle, triage, capability-hardening, or consequence semantics become complex enough to deserve one.
- **Routine session evidence** — completed Issue #21 established the collector/product contract. `../session-evidence.md` is the current user-facing contract; a design record is unnecessary unless future evidence semantics become a distinct architecture problem.

Do not create empty placeholder files merely to make the list look complete.

## Source discipline

External articles, posts, and community projects are design inputs, not automatically project truth. Summarize the relevant claim, link the original/available source, label its evidence type, and preserve important counterarguments.

The initial design pass drew particularly from:

- OMP Hashline/edit contract and first-party benchmark material: https://github.com/can1357/oh-my-pi
- `GPT-6 Astra 之后，哪些 Harness 还值得做？` mirror: https://www.iconb.cn/article/0eec42eaeef142c5df5c5e1f88864592
- Doug Colkitt discussion mirror: https://zamantika.com/0xShual/status/2096440481630585128
- Maker Jackie Astra usage notes: https://www.makerjackie.com/blog/2026-09-07-gpt6-astra
- LINUX DO wait/subagent discussion: https://linux.do/t/topic/2894195

Future reviewers should re-check original sources before turning time-sensitive or quantitative external claims into stronger project assertions.
