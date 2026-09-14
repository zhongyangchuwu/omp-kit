# OMP PR #9521 Phase A capability-boundary experiment

Date: 2026-09-14

Result: **PASS for the tested upstream preview only**.

This bundle preserves the accepted runtime evidence behind Issue #5 Phase A. It does not claim released-runtime support and it does not claim that omp-kit independently re-tested every internal #9521 path.

## Question

Does upstream OMP PR #9521 provide a real hard per-subagent capability boundary sufficient to prevent omp-kit worker sessions from inheriting or remounting Main-only capabilities such as `omp_kit_feedback`?

The key regression was stock OMP 18.1.19 behavior where `sol-review`, despite a read-oriented declared tool surface, could regain `write` transport through a mounted write-tier extension and invoke:

```text
write(path="xd://omp_kit_feedback", ...)
```

## Exact revisions

```text
omp-kit tested:        d4347ee45a9f35f9af1fb7a078f716a7a20348c0
OMP #9521 preview:     f5bcee2e82a754d2190d8ddb8aee73b5d237dffb
normal installed OMP:  18.1.19 (unchanged after experiment)
evidence/docs commit:  43944939ead4b58b24075e2578f70c7781fb8fa5
```

The tested OMP revision was a merge commit whose first parent was the previously inspected `77e84d41ae7b2541e5285a5f0b9cced8aa9ed74d`. The capability-scoping implementation relevant to this experiment was unchanged across that update; the exact runtime probes nevertheless used `f5bcee2e...`.

## Isolation

The local Agent reported the following isolation controls:

- independent `/tmp` upstream clone at the exact detached preview revision;
- local build of the native addon and preview binary;
- temporary `HOME`, OMP profile, agent/config/cache directories, and empty working directory;
- omp-kit linked only into the temporary preview profile and uninstalled afterward;
- SDK probes using `Settings.isolated`, `SessionManager.inMemory`, `taskDepth: 1`, `enforceToolAllowlist: true`, and required `yield` normalization;
- no external provider/model calls; the lifecycle probe used the bundled mock provider with a network fetch trap reporting zero external calls.

The real installed OMP and user profile were not intentionally modified.

## Per-agent capability result

| Agent | Effective enabled/active tools | `omp_kit_feedback` | `write` |
| --- | --- | --- | --- |
| `luna-code` | `read, grep, glob, edit, write, bash, yield` | absent from enabled/active/callable/`xd://` | present because explicitly declared |
| `luna-deep` | `read, grep, glob, edit, write, bash, yield` | absent from enabled/active/callable/`xd://` | present because explicitly declared |
| `luna-doc` | `read, grep, glob, edit, write, yield` | absent from enabled/active/callable/`xd://` | present because explicitly declared |
| `sol-review` | `read, grep, glob, yield` | absent from enabled/active/callable/`xd://` | registered internally but disabled, inactive, non-callable, not mounted |

A tool remaining in the internal registry was not treated as a capability leak. The relevant boundary was whether it became enabled, active, callable, or reachable through `xd://`.

For `sol-review`, the old stock-18.1.19 feedback path could not be reproduced because neither callable `write` transport nor the mounted feedback device existed. No feedback record was produced.

## Generic extension/custom/MCP boundary

A separate provider-free fixture registered:

- an ordinary extension tool;
- an SDK custom tool;
- a late-registered extension tool;
- a real stdio MCP tool plus a server-instruction sentinel.

The scoped child registry observed those registrations, proving the fixtures loaded, while the effective enabled/active surface remained only the allowlisted ordinary tool(s) plus required protocol tool(s). The `xd://` catalog and mounted names remained empty.

The following attempts did not reintroduce excluded capabilities:

- extension `session_start` late registration;
- MCP refresh;
- broad `setActiveToolsByName(all)` mutation.

Scoped-out MCP tool names and server instructions were also absent from the child system prompt.

## Protocol behavior

A mock-provider child turn exposed `read, yield`, invoked hidden `yield`, returned `Result submitted.` with structured details `{phase: "A4", result: "child-yield-ok"}`, and reached `turn_end` and `agent_end`.

`goal` was observed as a hidden registry/protocol tool and was not treated as an ordinary allowlist leak. Other protocol/orchestration tools absent from this child shape were not inferred to be broken.

## Environment integrity and repository verification

After the experiment:

- temporary checkout/profile/probe directories were deleted;
- preview plugin was uninstalled;
- installed runtime remained `omp/18.1.19`;
- before/after SHA-256 values matched for the real `config.yml`, `mcp.json`, plugin registry, plugin lock, and marketplaces config;
- committed agent definitions were unchanged;
- final repository `just verify` passed: 126 Python tests, 11 Bun tests / 57 assertions, TypeScript typecheck, installer/registry/validation checks, and `git diff --check`.

## Evidence boundary

This experiment directly validated the omp-kit-relevant scoped child-session capability surface, including the real feedback extension, generic extension/custom/MCP fixtures, runtime mutation attempts, and protocol completion.

It did **not** independently replay every internal upstream path such as cold revival or Cursor-native frame/resource handling. The `tools:` discovery/task-executor wiring and those additional paths are partly supported by upstream #9521's own tests rather than a separate omp-kit end-to-end CLI task-spawn replay.

The original temporary probe scripts and raw runtime traces were deleted after the experiment. Therefore this bundle is a **durable auditable snapshot**, not a byte-for-byte replay package. Future experiments that warrant reproducibility should retain small probe scripts/fixtures when doing so is cheap and safe.

## Decision

**Accepted result:** the tested OMP #9521 preview provides the hard per-subagent capability boundary needed for omp-kit's current worker model.

**Not established:** supported released OMP compatibility. Issue #4 remains open until a supported release contains the boundary and passes released-runtime smoke.

Phase A does not justify adding new default worker tools. Tool usefulness is evaluated separately in Issue #5 Phase B.

## References

- Issue #5 Phase A result: https://github.com/zhongyangchuwu/omp-kit/issues/5#issuecomment-5654573689
- Issue #4 released-runtime blocker: https://github.com/zhongyangchuwu/omp-kit/issues/4
- Issue #12 durable evidence design: https://github.com/zhongyangchuwu/omp-kit/issues/12
- Current validation summary: `../../../docs/VALIDATION.md`
