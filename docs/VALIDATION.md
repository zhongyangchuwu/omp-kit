# Validation and evidence boundaries

This document records which claims have evidence, not an automatically refreshed CI badge. Exact current candidate SHAs and run results belong in the owning PR/Actions. Accepted design and compact experiment evidence remain distributed in this repository.

## Deterministic repository gate

```sh
bun install --frozen-lockfile
just verify
```

The retained gate covers:

- Bun repository-contract tests for package/native-resource wiring, agents/Skills, documentation/support files and Skill-authoring guides/templates;
- TypeScript typecheck plus feedback/session-evidence/assurance unit and CLI tests.

CI also checks the committed Bun graph, candidate changed lines and tracked-file drift. PR merge-ref and landed-main checks answer different questions. The root Python helper/test environment, config-copy installer and resource-registry machinery are no longer part of the gate; maintained runtime and documentation contracts remain directly tested.

No cloud spending, external document upload, real model call or user-profile write is part of deterministic acceptance. The gate is not an upstream OMP schema/runtime test.

## OMP 18.1.21 feedback acceptance

The user supplied released-runtime evidence for PR #3 at `1cd5de1f1d8d0bb90e063d2a8eced0026b55990c`:

- Main recorded durable feedback with id/time/cwd/session/file provenance.
- One actual `luna-code` worker read package metadata, recorded feedback, yielded and exited normally.
- Worker provenance used its child session file; no caller-agent identity was fabricated.
- No repository, policy, Issue, profile or configuration mutation occurred.

The test used public explicit extension loading against the checkout because `--plugin-dir` alone did not expose the tool in that environment. This proves that loading path, not every possible installation topology.

Evidence: [Issue #4 runtime report](https://github.com/zhongyangchuwu/omp-kit/issues/4#issuecomment-5665260086).

## OMP 18.1.21 collector acceptance

Initial acceptance at `baa192eec186aa8fbfda5b36da0d993ad199dced` found a real bug: the documented filesystem-path filter returned zero sessions because OMP `/api/sessions.folder` was an encoded storage key. Bounded diagnostic collection showed that summary generation, completed-session skipping, Main/child feedback correlation and raw-session integrity worked.

The fix uses public trace `cwd` for actual-path filtering, with a regression test. A subsequent user retest reported no errors. That brief retest did not include full counters, so it must not be rewritten as a new detailed quantitative acceptance report. The earlier diagnostic report and deterministic regression tests supply the more specific evidence.

Evidence: [Issue #21 runtime report](https://github.com/zhongyangchuwu/omp-kit/issues/21#issuecomment-5665260067); upstream `can1357/oh-my-pi#12060`.

Current limits:

- provider is sampled per `(track, model)`, not an exact per-request routing ledger;
- child activity-envelope overlap is not CPU/GPU concurrency;
- counters do not determine task quality, human effort or business quota;
- collector invocation is manual/operator-scheduled; no default daemon is installed;
- derived summaries stay outside Git and do not replace selected reproducibility evidence.

## Earlier native-foundation evidence retained as context

The former archive's unique useful conclusions remain here, with original provenance:

[Exact native-foundation report before archive removal](https://github.com/zhongyangchuwu/omp-kit/blob/47a2951f47c9c55ce8f8cb020220288f9e28f871/docs/archive/native-foundation/VALIDATION_PHASE1_2026-09-13.md).

On OMP 18.1.18, isolated native link/discovery/uninstall exercised four agents and fifteen Skills without modifying the real user profile. Old parser-hiding wording in that report was subsequently corrected; it is not current activation policy.

Five deterministic fixtures compared bundled `sonic` and custom `luna-code` at `eebeb1ac1b992cf754930cf50b1a29c547867187`. Both arms passed 5/5 checks. Observed total tokens were 634,708 versus 454,638 and mean wall time 54.65 versus 48.13 seconds, with the token difference dominated by cache reads. This supports worker viability in that sample, not universal delegation or quota savings.

A real parent-history smoke recovered accepted requirements (3/3), rejected superseded/tentative alternatives and checked repository facts. Same-session persistence exercised three related tasks across two wakeups, **not** a general parked-to-revived/restart guarantee. Notes-backed rollover recovered the accepted decision and passed two checks; an empty-string `context_notes` call cleared notes on that tested version and must not be used as a read surrogate.

A later search-first smoke remained correct but used 642,661 total child tokens versus 200,731 in an earlier whole-history smoke with different histories. This is explicitly not a controlled efficiency comparison.

## Compact controlled experiments

The original Phase-A, B1 web-search and B2 LSP bundles remain under [evidence/experiments](../evidence/experiments/) with original identities and limitations. Phase A was preview hard-scoping evidence, not released-runtime support. B1 was a limited useful-use observation; B2's natural zero LSP calls did not show that LSP is globally useless.

## What is still not established

Repeated fresh-session issue-centered project-state recovery and GitHub-offline limitations (#11), robust delegation economics (#8), long-run capability value (#5), and systematic scaffolding ablation (#9) remain unfinished. Documentation cleanup does not supply those experiments.

Retaining Skills also does not certify every external dependency/provider/version. Cloud parser, profile, browser and LSP claims require relevant authorized runtime checks when they are actually the subject of work.
