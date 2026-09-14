# Issue #5 Phase B1 — `web_search` for `luna-deep`

## Decision

**Later**, scoped to `luna-deep`.

Adding only `web_search` to the real `luna-deep` baseline produced a materially more efficient upstream-research run without reducing factual quality. One pair is not enough to change the committed agent definition because full tool-schema overhead was not captured, the PR changed during the experiment, and the observed search backend did not follow the intended provider preference.

## Controlled comparison

Both fresh child-shaped sessions used:

- omp-kit `43944939ead4b58b24075e2578f70c7781fb8fa5`;
- OMP preview `f5bcee2e82a754d2190d8ddb8aee73b5d237dffb`;
- `cpa/gpt-5.6-luna:high`;
- task SHA-256 `808dd983ef90e3cd0c261c4fc3925cebe621b2ff01890dc79be12d8c887b2567`;
- the same cwd, normal bash/network availability and hard allowlist;
- no Main intervention during either run.

Baseline tools:

```text
read, grep, glob, edit, write, bash, yield
```

Treatment tools:

```text
read, grep, glob, edit, write, bash, yield, web_search
```

## Decision-critical observations

| Observation | Baseline | `+ web_search` |
| --- | ---: | ---: |
| duration | 424,367 ms | 293,947 ms |
| model requests | 23 | 18 |
| non-cache-read tokens | 356,351 | 324,524 |
| total tokens including cache reads | 3,785,215 | 3,311,020 |
| reference cost | $0.15283148 | $0.13380772 |
| tool calls | 98 | 67 |
| tool errors | 2 | 0 |
| system-prompt bytes | 11,526 | 11,553 |

The treatment selected `web_search` eight times, then read primary GitHub pages and source directly. Both answers were correct at their observation times. Search improved repository/source discovery and reduced exploratory reads/greps; it did not create an information-access capability the baseline completely lacked.

## Provenance and limits

- Eight searches returned 102 raw results, including community issues and secondary summaries.
- The worker correctly grounded final claims in primary GitHub metadata/source; Main did not need to repair the provenance chain.
- All observed search calls reported Exa even though the harness requested a DuckDuckGo preference.
- PR #9521 advanced from `3a0c189...` to `bf7840e...` and then `7124ab87...` during the pair. Git ancestry confirmed those were successive heads.
- Exact JSON tool-schema bytes were not measured. The +27-byte figure covers the system prompt only.
- This was one stochastic pair on one task.
- The run used `runSubprocess` results, raw subagent events and session JSONL. The standardized OMP stats/trace path introduced concurrently on the branch was not used; validate it under Issue #13 before B2.

## Artifacts

Raw reports, outputs, session JSONL and the runner are retained in the ignored local workspace:

```text
.experiments/2026-09-14-omp-9521-b1-web-search/
```

Checksum index SHA-256:

```text
e77c42dd7320ded3bee03c35839aebf18c250ebbe77f3b23041827746ace8763
```

This is currently local-only retention. Promotion to a durable external artifact store remains pending the flow tracked in Issue #12. The user explicitly requested that the experiment data not be deleted.

## Post-B1 retention and telemetry amendment — 2026-09-14

The artifact description above remains the historical state at B1 acceptance. Issue #12 subsequently froze the protected local copies into canonical artifact id `2026-09-14-omp-9521-b1-web-search` under the configured persistent artifact-root policy:

```text
${XDG_DATA_HOME:-$HOME/.local/share}/omp-kit/artifacts/
```

The new retention state is `local-retained`. The frozen artifact contains 288 regular files and 196,379,734 bytes including its checksum index. `checksums.sha256` covers the other 287 files and has SHA-256:

```text
7b69967d002989cd8c487bec9e1a56cead561177a6c5ca587ba7d7cbc9331d20
```

The historical staging index `e77c42dd...8763` is preserved unchanged inside the canonical provenance directory; it covered only nine decision-critical files and did not cover the complete retained tree. No source copy was deleted. Remote replication remains unset.

Installed OMP 18.1.19 then read copies of the retained baseline and treatment sessions from an isolated temporary `HOME` and named profile. The real profile was not used as a session destination. The probe used `/api/sync`, `/api/sessions`, `/api/session/trace`, and `/api/session/entry`; it made no provider/model call.

| Observation | OMP-native result | Boundary |
| --- | --- | --- |
| session identity | covered by sessions + trace file | stable experiment/run identity remains in `run.json` |
| root/child relation | trace has track `parentId` | not exercised because each B1 arm is a standalone one-track session |
| main/subagent/advisor tracks | main covered; subagent/advisor unexercised | B1 contains only one `main` track per arm |
| model spans/duration | covered | per-request spans plus aggregate `modelMs` |
| tool spans/duration/errors | covered | per-call spans and per-tool calls/errors/total/max duration |
| wall/model/tool/idle time | covered | trace wall excludes small harness/process overhead |
| requests | covered | exact 23 / 18 collector match |
| token usage | covered | trace total matches; entry usage recovers the exact non-cache-read totals |
| cost/unpriced | covered | exact cost match; both have zero unpriced requests |
| TTFT | covered | available per model span |
| subagent overlap | trace supports tracks/spans | not exercised by this dataset |
| effective allowlist | not in post-hoc trace | record configured/effective surface in `run.json`; trace shows only tools actually used |
| arm/task hash/acceptance/intervention | not OMP-owned | record in `run.json` and Git evidence |

OMP-native telemetry is sufficient for comparable experiments when paired with omp-kit-owned run metadata. No local session parser, stats database, trace builder, or generic full-event collector is justified by this probe.

The minimum future retained set is `run.json`, `checksums.sha256`, OMP session summary + trace, task specification, worker result, and the original OMP JSONL/referenced artifact tree for material experiments that need later re-analysis. Do not retain request-detail exports by default; use `/api/session/entry` only for a decision-critical field absent from trace.

## References

- Issue result: https://github.com/zhongyangchuwu/omp-kit/issues/5#issuecomment-5654852393
- Final verification: https://github.com/zhongyangchuwu/omp-kit/issues/5#issuecomment-5654855131
- Canonicalization result: https://github.com/zhongyangchuwu/omp-kit/issues/12#issuecomment-5655109743
- OMP telemetry result: https://github.com/zhongyangchuwu/omp-kit/issues/13#issuecomment-5655109730
- Final canonical totals correction: https://github.com/zhongyangchuwu/omp-kit/issues/12#issuecomment-5655139630
- Single-track coverage correction: https://github.com/zhongyangchuwu/omp-kit/issues/13#issuecomment-5655139624
- Phase A boundary bundle: `../2026-09-14-omp-9521-phase-a/`
- Experiment policy: `../../../docs/experiments.md`
