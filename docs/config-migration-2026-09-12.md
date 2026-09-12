# Configuration import: 2026-09-12

## Inputs

User-uploaded `config.yml`, `models.yml`, and `APPEND_SYSTEM(1).md` from the local
OMP agent directory. These supersede the previous branch's guessed minimal setup.
No literal bearer/OAuth credentials were present; both providers used variable names.

## Preserved

All supplied behavioral settings except the device-specific fields below; in
particular concurrency stays **4**, notes-backed stays **true**, and the fallback
order stays **remote then soft**. CPA stays `/v1` + `openai-responses`; the original
`CPA_API_KEY` and `DEEPSEEK_API_KEY` references, all six model identities, declared
context/output sizes and DeepSeek compatibility flags are preserved.

## Deliberate changes

| Input | Change | Reason |
| --- | --- | --- |
| setupVersion / dev.autoqaConsent | Not tracked; preserve only an existing machine's values | Setup state and consent are not portable permissions |
| Earlier branch's CPA /backend-api route | Replace with uploaded /v1 Responses route | Use evidence from the working configuration |
| Earlier CLIPROXYAPI_API_KEY | Replace with CPA_API_KEY | Preserve the user's actual variable contract |
| cost.tiers | Archive in config/reference/pricing.yml; remove from loaded models.yml | Not supported in the checked OMP model schema |
| DeepSeek minLevel/maxLevel | Equivalent explicit high/xhigh efforts | Same selected effort set, current representation |
| Astra/Sol/Terra | Add compactionModel pointing to CPA Luna | Previously agreed summarizer policy, without changing live model |
| Long Vibe APPEND | Archive original; deploy short entry point and skill references | Keep workflow-specific policy out of the permanent prompt |
| Skill/agent deployment | Default to managed copies with hashes | Works without symlink permissions and makes runtime changes explicit |

The supplied prices remain user reference data, not externally validated prices.
Neither this import nor an offline test establishes model availability, actual
provider effort behavior, quota capacity or the quality of notes-backed memory.

## Safety and rollout

Installer preflight runs before runtime writes. Replacements and retired owned units
have private backups and a journal; ordinary errors are rolled back. No inference
or credential migration occurs. `.env`, OAuth stores, sessions, MCP config and
unrelated resources stay on the machine. Existing files require explicit adoption
when their content differs; use `--force --dry-run` before `--force`.

For headless hosts use `headless`; for older runtimes or notes issues use
`legacy-context`. These are opt-in deviations from the imported base.
