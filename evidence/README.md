# Durable experiment evidence

This directory preserves **small, durable decision/provenance evidence for experiments that materially support an omp-kit design or capability decision**.

It is not the experiment dataset store and it does not replace GitHub Issues, `docs/VALIDATION.md`, design records, executable tests, or retained raw artifacts outside Git.

## Information roles

```text
GitHub Issue
  chronological discussion, hypotheses, progress, review

Evidence bundle
  compact durable snapshot of what was tested, under which revisions, and what decision the evidence supports

Retained artifact store
  raw/repeated run data used for later audit or re-analysis; may be local-only or remotely replicated

VALIDATION.md
  current accepted validation summary

docs/design/*.md
  why the evidence changes or constrains a design

tests / fixtures / scripts
  executable regression or reproducibility mechanism when justified
```

## Bundle contract

Accepted experiments should use:

```text
evidence/experiments/<experiment-id>/
  README.md
  manifest.json
```

Optional `summary.json` is allowed for compact decision-critical metrics that remain useful without the raw dataset.

`README.md` is the human-readable claim, method, result, and evidence boundary.

`manifest.json` records machine-readable identity and provenance: exact project/upstream revisions, runtime/model information, experiment design, OMP telemetry interfaces, artifact identity/state/checksum, related Issues, and limitations.

Do not commit full session transcripts, large trace/request dumps, repeated raw reports, stdout/stderr, or other experiment datasets merely for convenience. Retained raw artifacts belong outside Git and may initially be `local-retained`; cloud/remote replication is optional and must not change experiment/run identity or the frozen bundle checksum.

The first Phase A bundle predates this stricter split and contains a small `results.json`. Keep it as historical evidence; do not rewrite it merely for format uniformity.

## Immutability

An accepted evidence bundle is historical evidence. Do not silently rewrite an old run to match a newer interpretation.

- A materially different rerun gets a new experiment or run id as appropriate.
- A factual correction or storage/telemetry amendment should be explicit in the bundle and/or owning Issue.
- Current conclusions may change in `docs/VALIDATION.md` or a design record without deleting the historical observation.

## Security and scope

Never commit credentials, private prompts, secrets, machine-specific absolute artifact paths, or sensitive traces merely for reproducibility.

Normal `just verify`/CI runs do not need evidence bundles. Create one when an experiment materially supports a design decision, upstream compatibility claim, model/tool-routing decision, or other result likely to be cited later.

## Current bundles

- `experiments/2026-09-14-omp-9521-phase-a/` — isolated preview evidence that OMP PR #9521 enforces the hard worker capability boundary required by omp-kit, with released-runtime support explicitly still unresolved.
- `experiments/2026-09-14-omp-9521-b1-web-search/` — controlled `luna-deep` baseline versus `+ web_search` evidence; the decision is `later`, with retained raw data currently local-only while the artifact/telemetry flow is standardized.
- `experiments/2026-09-14-zotero-neo-b2-luna-code-lsp/` — controlled `luna-code` baseline versus `+ lsp`; the treatment made zero LSP calls and the scoped decision is `reject` for default exposure from this evidence.

The experiment lifecycle/data contract is defined in `docs/experiments.md` and tracked in GitHub Issue #12. The accepted OMP-native telemetry path is preserved in completed Issue #13.
