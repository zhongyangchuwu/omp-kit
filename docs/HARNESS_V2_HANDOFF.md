# Harness v2 implementation handoff

## Goal

Maintain a portable personal OMP harness, using the owner's actual settings rather
than guessed endpoints. Installation after OMP setup should deploy configuration,
custom agents and active skills reproducibly, while retaining credentials and local
state on each machine. It cannot create provider accounts/quotas or system dependencies.

## Source priority

Read README.md, docs/omp-installation.md, docs/omp-configuration.md and
config-migration-2026-09-12.md. Earlier chat snippets and earlier versions of this
handoff are design history, not current instructions. A new OMP session cannot
retrieve the separate ChatGPT conversation via history://Main.

## Implemented surface

- Canonical user-derived config/models; CPA /v1 Responses and CPA_API_KEY.
- All six uploaded models, recorded reference prices, archived unsupported tiers.
- Short global prompt entry point; detailed coordination/context/Vibe compatibility
  in omp-workflow references; bounded execution in its own skill.
- Four role-backed restricted workers without redundant hard-coded effort fields.
- Cross-platform copy installer, uv script dependencies and shell/PowerShell wrappers.
- Profiles, persistent machine-local overrides, previews, drift detection, private
  transaction backups, ordinary-error recovery and guarded rollback.
- Offline doctor without inference or printing credential values.

## Constraints

Do not grant another machine's setup or QA consent. Do not commit keys, `.env`, auth
stores, backups or session logs. Preserve the imported concurrency=4 and notes-backed
setting unless deliberately changing a profile. Do not reintroduce the guessed
/backend-api transport, CLIPROXYAPI_API_KEY, unsupported cost.tiers, or invented
compaction-effort/minimal-harness settings.

Do not blindly equate a short agent body with a short provider-facing system prompt.
Tool restrictions are not security isolation. Reviewer needs a readable diff artifact;
doc workers need another verifier when commands are required.

## Local rollout

1. Close OMP. Check branch/status and keep local work separate from this change.
2. Run the combined checks once after a coherent change, not after every document edit.
3. Preview the existing-machine migration with `--force --dry-run`; inspect its scope.
4. Supply CPA_API_KEY in the launching environment or agent-root .env. Keep DS optional.
5. Apply the installer. It backs up conflicts; do not manually delete drift/manifest files.
6. Run --doctor. Confirm the actual installed OMP version and effective config.
7. Start OMP, verify role/agent discovery, one scoped code task and one doc task, and
   confirm live history/context tools rather than assuming them.
8. Verify notes-backed rollover, worker result/reuse behavior, CPA auth/streaming,
   and target-machine browser/LSP needs in normal use.

No live provider/OMP result should be claimed from static tests alone. Native Windows
and macOS installation paths still require real-machine smoke checks when only Linux
was used for development. See docs/VALIDATION.md for recorded checks and gaps.

## Deferred

No OMP fork, custom runtime scheduler, raw cross-agent history API, automated context
curator, pricing service, provider provisioning or replacement minimal system prompt.
Keep those separate unless a concrete observed problem justifies them.
