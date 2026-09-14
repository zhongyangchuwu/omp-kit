# Validation summary

Date: 2026-09-14

This file records current accepted validation evidence and its limits. Mutable candidate readiness belongs in the owning PR / GitHub Actions; chronology belongs in Git and completed Issue/PR history.

## Current baseline

```text
product candidate:          omp-kit 0.1.0
runtime evidence baseline:  OMP 18.1.21
core agents:                luna-code, luna-deep, luna-doc, sol-review
core Skills:                omp-workflow, git-workflow, bounded-executor, omp-review
shared feedback:            landed / accepted
session evidence:           landed / accepted
repository gate:            Bun typecheck + Bun tests
```

The pre-release subtraction removes the legacy installer/config snapshot, generated Skill registry/promotion framework, generic/integration Skills and history-only repository artifacts. Those removals narrow the supported product surface; they do not invalidate the accepted runtime behavior below.

## Deterministic repository gate

For the reduced native package, GitHub Actions:

- checks out without persisted credentials;
- installs Bun from the repository `packageManager` contract;
- runs `bun install --frozen-lockfile`;
- runs `bun run verify` (`tsc --noEmit` + all Bun tests);
- checks changed lines and rejects tracked-file drift.

This gate covers the feedback extension, session-evidence collector and native package/resource contract. It does not call providers/models or prove machine-specific OMP behavior.

## Native package contract

The core package intentionally contains only resources required by current omp-kit behavior. The deterministic contract checks:

- package metadata and extension wiring;
- exactly four model-neutral task agents;
- exactly four core Skills;
- worker/reviewer autoload references resolve to those Skills;
- `omp-workflow` carries only its five current references;
- the Main-only workflow rule remains present;
- feedback/session-evidence TypeScript behavior and types remain valid.

OMP itself owns plugin resource discovery. OMP Kit does not mirror the discovered set into `registry.yaml`.

## Shared feedback — OMP 18.1.21

Released-runtime smoke established that:

- Main can record durable structured `omp_kit_feedback`;
- a normal `luna-code` worker can record feedback and exit normally;
- records retain supported session id/file provenance;
- no nonexistent caller-agent identity is fabricated;
- recording does not authorize repository, policy, configuration or GitHub/Issue mutation.

The feedback sink is intentionally shared bounded evidence, not a Main-only authority capability. Stronger future per-agent runtime isolation can still be useful but is not part of the v0 acceptance contract.

## Session evidence — OMP 18.1.21

Released-runtime acceptance established that:

- ordinary saved sessions are summarized through public OMP stats/session surfaces;
- compact summaries stay outside Git and do not copy full transcripts;
- unchanged completed sessions are skipped; active sessions may rebuild as their revision changes;
- model requests, token/cost-equivalent activity, sampled provider provenance, tool calls/errors/durations, timing and Main/subagent tracks are represented;
- Main and worker feedback correlate through trace-track session files;
- checked source transcripts remained byte-identical;
- normal filesystem-path filtering works through public trace `cwd`.

Provider identity is sampled per `(track, model)`, not an exact per-request routing ledger. Same-model provider switching may therefore be conflated; request/model/token/tool counts do not depend on the sampled label.

OMP 18.1.21 exposes a stats `folder` vs trace `cwd` representation mismatch, tracked upstream as `can1357/oh-my-pi#12060`. OMP Kit uses trace `cwd` rather than cloning OMP's storage-key encoding.

## Worker boundaries

Current agents are observational surfaces, not permanent capability claims. Workers do not recursively orchestrate. `sol-review` remains intent-level read-only. OMP's combined `github` built-in remains Main-owned because it includes remote mutation.

Issues #5 and #8 own later evidence-based pruning/routing decisions. Do not run synthetic tool-use experiments solely to populate telemetry.

## Evidence discipline

- CI evidence, released-runtime smoke, external read-back and model judgment answer different questions.
- Do not repeat an unchanged full gate without a new candidate or verification question.
- Do not retain history-only files in the current tree merely for audit; Git and Issue/PR history preserve them.
- Keep routine session evidence outside Git.
- Promote a durable conclusion into current docs/Issues only when it remains relevant to current behavior.
