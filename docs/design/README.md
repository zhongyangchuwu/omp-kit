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

Always preserve material limitations. A one-user wait trace is not a universal cost ratio. A personal bake-off is not a public benchmark. A preview branch is not a released-runtime compatibility guarantee.

## Persistence rule

Unresolved design work must not exist only in a chat transcript or model memory.

Use this routing rule:

```text
accepted rationale/evidence      -> docs/design/*.md
unresolved question/experiment   -> GitHub Issue
chronological experiment updates -> Issue comments
implementation/review            -> Pull Request
old phase-specific long evidence -> docs/archive/
```

If a design record names an open question that could change implementation or policy, it should link to an Issue with a closure condition. When that Issue resolves, promote the durable conclusion back into the record.

## Current records

| Record | Current status | Main persistent work |
| --- | --- | --- |
| [`harness-boundary.md`](harness-boundary.md) | accepted principle, recurring audit | #9 model-compensation ablation |
| [`delegation.md`](delegation.md) | accepted routing shape, economics still evolving | #8 delegation economics; #5 worker tools; #6 integration |
| [`verification.md`](verification.md) | accepted principle, policy refinement open | #6 parallel integration/verification |
| [`supervision.md`](supervision.md) | accepted local policy, upstream-limited runtime | #7 OMP coordination gaps |
| [`context-authority.md`](context-authority.md) | accepted authority/provenance policy, dogfood ongoing | #11 information-model dogfood; runtime/context changes |

## Coverage backlog

The following topics are real and persistent but do not yet have a full design record. Their unresolved state is stored in Issues rather than model memory:

- **Worker capability surface** — Issue #5. Future record should explain why each worker tool exists, what its capability cost is, and which boundaries OMP must enforce.
- **Model routing / delegation economics** — Issue #8. Currently kept inside `delegation.md` because task shape and routing economics are tightly coupled; split only if the evidence becomes large enough.
- **Independent parallelism / ownership** — currently part of `delegation.md` and Issue #6. Split when it develops mechanisms/evidence distinct from delegation itself.
- **Self-hosting feedback** — implementation exists and Phase 1.5 is documented in current validation/Issue #4. Add a dedicated design record when the Main-only capability boundary is available on a supported OMP release and the mechanism can be evaluated end-to-end.

Do not create empty placeholder files merely to make the list look complete. A new record should begin when there is enough real problem/evidence content to review.

## Source discipline

External articles, posts, and community projects are design inputs, not automatically project truth. Summarize the relevant claim, link the original/available source, label its evidence type, and preserve important counterarguments.

The initial 2026-09-13 design pass drew particularly from:

- OMP Hashline/edit contract and first-party benchmark material: https://github.com/can1357/oh-my-pi
- `GPT-6 Astra 之后，哪些 Harness 还值得做？` mirror: https://www.iconb.cn/article/0eec42eaeef142c5df5c5e1f88864592
- Doug Colkitt discussion mirror: https://zamantika.com/0xShual/status/2096440481630585128
- Maker Jackie Astra usage notes: https://www.makerjackie.com/blog/2026-09-07-gpt6-astra
- LINUX DO wait/subagent discussion: https://linux.do/t/topic/2894195

Future reviewers should re-check original sources before turning time-sensitive or quantitative external claims into stronger project assertions.
