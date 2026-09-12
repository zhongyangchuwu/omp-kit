# Canonical configuration and source boundaries

## Current source of truth

`config/config.yml`, `config/models.yml` and `config/APPEND_SYSTEM.md` are the
portable source files. `config/profiles/*.yml` contains opt-in settings overlays.
`config/reference/` is never installed or loaded by OMP.

The base runtime settings preserve the owner's 2026-09-12 upload, including:

- Sol medium default; Luna high/max workers; Sol high planning/review roles;
- four allowed concurrent tasks, one recursion level, asynchronous tasks enabled;
- disabled prewalk/advisor and model fallback;
- hashline editing, existing LSP/read behavior and the chosen personal UI;
- notes-backed context enabled, with legacy method order `remote, soft`.

This supersedes older guide examples that chose two workers or `shake, soft`
automatically. `legacy-context` is now an explicit alternative, not the base setting.
No benchmark-derived quota target is hard-coded.

## Model/provider configuration

CPA uses the uploaded `http://localhost:8317/v1` and `openai-responses` transport.
The environment-variable name is **CPA_API_KEY**, not CLIPROXYAPI_API_KEY.
The four CPA entries are Astra, Sol, Terra and Luna. Both supplied DeepSeek entries
are retained with their request compatibility fields. Their legacy high/xhigh range
is represented as the equivalent explicit `efforts` list.

The uploaded context/output declarations are preserved; they are configuration
metadata, not a verified promise from the upstream service. Astra/Sol/Terra have a
`compactionModel` targeting CPA Luna. That selects a summarizer for applicable
soft-compaction paths, not the live model or an independent effort level. Native
remote compaction is route-dependent and may take a different supported path.

`cost` contains the user's four scalar reference prices. Unsupported `cost.tiers`
has moved to `config/reference/pricing.yml`. These figures are not independently
verified billing rates or a conversion of Team quota; do not interpret OMP's dollar
estimate as actual subscription expenditure. No new prices were invented.

## Credentials

Use environment variables or OMP's agent-root `.env`; see `config/secrets.env.example`.
Real keys are never passed on installer command lines, written into tracked YAML,
or included in install state. The installer does not copy a `.env` into the runtime.

OMP treats a models.yml `apiKey` string as env-name-or-literal. If CPA_API_KEY is
missing, OMP can otherwise treat those letters as a literal key; the offline doctor
therefore flags a missing variable. Optional DeepSeek is not usable until its key
is configured. No shell-specific `!printenv` expression is required.

## Machine-local overrides

Copy only needed templates from `config/local.example/` into
`<agent-root>/.omp-kit/local/`. Example local `models.yml`:

```yaml
providers:
  cpa:
    baseUrl: https://your-private-cpa.example/v1
```

Composition is `tracked config -> ordered config profiles -> local YAML -> explicit CPA URL`.
Mappings merge recursively; arrays replace wholesale. The installer exposes these
overlays as `--config-profile`; `--profile` remains a compatibility alias. To change
a single model's metadata, prefer `modelOverrides` rather than accidentally replacing
all `models`. Both YAML names in a local directory may be omitted. `--local-dir`
chooses another private directory; the installer remembers it on that machine.

`setupVersion` and `dev.autoqaConsent` are deliberately absent from the tracked base.
An existing machine's values are retained from its own configuration; a fresh machine
is not marked as already configured and receives no automatic telemetry/QA consent.

## Prompt policy

`config/APPEND_SYSTEM.md` is a short workflow entry point. Detailed delegation,
waiting and history policy lives in `skills/omp-workflow/references/`; worker execution
lives in `bounded-executor`. The uploaded Vibe-only prompt is preserved verbatim in
`config/reference/APPEND_SYSTEM.uploaded.md`, not silently loaded globally.

`vibe-compat.md` retains long waits (300/600 seconds) and avoids automatic paired
fast/good workers, while allowing direct selection of a deeper worker. Custom agents
use ordinary task/hub facilities, not invented Vibe replacement tool names.

## Upstream evidence checked 2026-09-12

- OMP `docs/models.md`, `docs/providers.md`, `docs/settings.md`.
- `packages/coding-agent/src/config/models-config-schema-bundle.ts` blob
  `d212cc907bd1c6575b03048b4b87ca74c8be207d`: four scalar cost fields, no tiers.
- OMP `docs/compaction.md` and `docs/task-agent-discovery.md` for context/agent limits.

The local validator is intentionally a kit consistency check, not a full OMP schema
implementation. Installed OMP version and actual provider responses remain the final
compatibility check. Do not add speculative configuration keys from old discussions.
