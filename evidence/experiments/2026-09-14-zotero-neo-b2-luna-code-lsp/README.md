# Issue #5 Phase B2 — full `lsp` for `luna-code`

## Decision

**Reject default full `lsp` exposure for `luna-code` from this B2 evidence.**

The treatment had a resolved and enabled TypeScript language server but naturally made zero `lsp` calls. Both arms produced complete, correct dependency maps. The treatment added prompt overhead and used more wall/model time, tokens and reference cost. Its lower read/grep/tool-call counts cannot be attributed to LSP because LSP was unused.

This does not claim LSP is useless for every coding task. It means this controlled pair provides no evidence for adding full LSP to the default committed `luna-code` surface.

## Fixed inputs

- omp-kit: `60060745c3ce1e501f8423bca9eceb6a502f2c53`
- OMP preview: `f5bcee2e82a754d2190d8ddb8aee73b5d237dffb`
- Zotero-Neo: `190c353fcdf23ac6f1b6a1f16bc3ad70cf51e069`
- model: `cpa/gpt-5.6-luna:high`; no fallback
- task SHA-256: `b2958332178458e585ca94d9d97756238237239330b49683ec3de8f937f1a11a`
- target tree: `3c1ec6406667fe445479e1ae0f3f15ddc1c5d2ad`
- package-lock SHA-256: `da4ea7e1eae843a53082024d0df6e3377fac763c56d1688e79c900d9b01516b4`
- workspace TypeScript: 5.9.3
- treatment language server: `typescript-language-server` 6.0.0 over stdio

Both target checkouts were independent detached copies at the same commit/tree with separate `npm ci` installations. Both remained clean after their run.

## Compared capability surfaces

Baseline:

```text
read, grep, glob, edit, write, bash, yield
```

Treatment:

```text
read, grep, glob, edit, write, bash, yield, lsp
```

The treatment did not gain `web_search`, `ast_grep`, `ast_edit`, `debug`, `omp_kit_feedback`, MCP, or another custom tool.

## Ground truth and correctness

Main independently inspected exact symbol references, the bounded execution/palette paths, preferences and Key Guide surfaces, and the relevant tests in the pinned tree. The ground truth has six semantic production consumer/path nodes:

1. Reader constructs the Reader command catalog with `READER_NORMAL_ACTIONS`.
2. Main constructs the Main/Note command catalog with `MAIN_NORMAL_ACTIONS`.
3. The addon bridges Reader palette contexts to Main.
4. Main wraps the context with owner-session liveness.
5. `FuzzyPicker` selects the commands provider.
6. `createCommandsProvider` consumes `context.actions` and activates through `context.execute`.

Actual execution capability is separate: resolved bindings feed the input engine; Reader executes local actions and delegates `main*`; Main validates the exact owner and executes its switch. Key Guide derives from resolved bindings, while Preferences uses global `ACTION_IDS` / `ACTION_LABELS`.

| Dimension | Baseline | `+ lsp` |
| --- | ---: | ---: |
| correct production consumer/path nodes | 6 / 6 | 6 / 6 |
| missed consumers | 0 | 0 |
| false consumers | 0 | 0 |
| semantic classification errors | 0 | 0 |

Both correctly identified the catalog-only minimum as the action constants and two controller construction sites, with optional contract/provider/test renaming if the distinction must become explicit. Both correctly separated that from the larger change required for runtime capability enforcement.

## OMP-native telemetry

| Dimension | Baseline | `+ lsp` | Treatment delta |
| --- | ---: | ---: | ---: |
| wall time | 211,862 ms | 226,160 ms | +6.75% |
| model time | 210,345 ms | 225,047 ms | +6.99% |
| tool time | 1,757 ms | 1,253 ms | -28.69% |
| requests | 12 | 10 | -16.67% |
| non-cache-read tokens | 95,709 | 107,496 | +12.32% |
| total tokens including cache reads | 520,157 | 536,552 | +3.15% |
| reference cost | $0.03794076 | $0.04101232 | +8.10% |
| tool calls | 48 | 37 | -22.92% |
| tool errors | 0 | 0 | 0 |
| read calls | 34 | 24 | -29.41% |
| grep calls | 12 | 10 | -16.67% |
| LSP calls/actions | N/A | 0 / none | no measured use |

OMP 18.1.19 `/api/sessions` and `/api/session/trace` supplied the metrics. No generic full-event collector or request-detail dump was used.

## Prompt/schema overhead

- baseline system prompt: 11,513 bytes
- treatment system prompt: 11,837 bytes
- delta: +324 bytes / +2.81%
- exact JSON tool-schema bytes: not measured

## Artifact

```text
id:             2026-09-14-zotero-neo-b2-luna-code-lsp
state:          local-retained
files:          19 including checksums.sha256
bytes:          1,612,212 including checksums.sha256
index entries:  18
index SHA-256:  45730539041f4ce62eaed9cdc1bd6e04f3604c125ae79ad11b7274a28c189019
remote:         unset
```

The canonical artifact retains `run.json`, OMP session summary/trace/original session, task, worker result, runner and compact analyses. Per-arm agent databases, temporary target checkouts, isolated stats state and the isolated language-server installation are excluded. No staging copy was deleted.

## Limitations

- One stochastic pair on one repository/task.
- Treatment made no LSP call, so no output difference is attributable to semantic navigation.
- Exact tool-schema bytes were not measured.
- Main's own LSP device had no server for the external checkout; independent ground truth used exact symbol search plus bounded source/test reads.
- The result rejects default exposure from this pair; a materially different future task would require a new, separately authorized experiment rather than reinterpreting B2.

## References

- Complete B2 result: https://github.com/zhongyangchuwu/omp-kit/issues/5#issuecomment-5655460718
- Experiment policy: `../../../docs/experiments.md`
- B1 evidence: `../2026-09-14-omp-9521-b1-web-search/`
