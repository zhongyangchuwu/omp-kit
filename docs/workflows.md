# Maintenance workflows

## Install and update

For the native core plugin, use `omp plugin link .`. OMP discovers the package's
agents, active skills and Main-only rule while leaving user configuration untouched.
Use `omp plugin uninstall omp-kit` to remove the link.

Use `install.sh`, `install.ps1` or `uv run --script scripts/install_harness.py` only for
the legacy/compatibility path that intentionally copies the Harness v2 configuration,
agents and registry-selected skills. Preview existing machines first and explicitly
adopt collisions with `--force` after reviewing planned paths. See
`omp-installation.md` for backups, drift and rollback.

Native plugin policy changes go into `package.json`, agents, skills, rules, or genuine
runtime extensions. Legacy settings changes go into tracked config; host URLs/UI
deviations belong in private local overlays or named profiles. Credentials remain in
the launching environment or agent-root `.env`, never tracked YAML.

## Skill lifecycle

Review third-party material in gitignored references/, extract maintained work into
drafts/, and promote deliberately using the existing promote-skill helper. Preserve
resource.yaml provenance/risk/verification metadata. Regenerate registry.yaml with
scripts/build_registry.py after resource metadata changes; do not hand-maintain it.
Drafts are never installed. The existing registry validation and risk scan remain.

## Verification and integration

Optimize accepted evidence per unit of work, not the raw number of verification
commands. Focused checks answer implementation/debugging questions; the integrated
repository gate answers whether the accepted final tree satisfies broad mechanical
contracts.

A worker normally runs the narrowest relevant checks for its own change and hands those
results to Main. Do not duplicate the repository-wide full gate in every worker merely
because it is offline or cheap. A worker-local full gate is reserved for a distinct
purpose such as an isolated pre-merge check, cross-slice diagnosis, explicit Main
request, or a worker that owns the exact final tree whose result can be reused as final
acceptance evidence.

After related workstreams settle, Main/integration ownership reconciles the actual
changed files with declared scopes and integrates the combined tree. If a shared type,
schema, catalog, interface, or other cross-slice contract changed, inspect its likely
consumers before acceptance:

- production call sites;
- tests and fixtures;
- mocks and fakes;
- contract-facing docs/examples;
- the explicit owner responsible for cross-slice integration.

Out-of-scope consumers return to Main/integration ownership; workers do not silently
expand writable scope merely because they discovered one.

When the repository's full deterministic gate is fast, offline, provider-free and
relevant, run it once on the accepted integrated tree. For the native core, the default
mechanical acceptance path is `.github/workflows/verify.yml`: GitHub Actions checks the
committed `uv.lock`, runs the repository-owned `just verify` entry point, and rejects
tracked-file drift on a clean hosted runner. The workflow requires only read access to
repository contents and no project secrets.

A successful CI run on the exact commit replaces the routine local-agent full gate for
CI-supported repository work. Local `just verify` remains useful as an optional pre-push
check or when diagnosing CI itself; local OMP/runtime/profile smokes remain necessary
when the claim depends on machine-specific or released-runtime behavior that CI does not
exercise.

If later review/integration fixes materially change behavior covered by the gate, the
new commit receives a new CI run because the tree changed — not because the workflow
crossed another phase label. Do not rerun an unchanged successful commit merely to
repeat the same evidence.

Independent strong review remains selective by failure cost. When practical, give the
reviewer a mechanically clean integrated diff so model judgment is spent on semantics,
lifecycle, product behavior, ambiguity, accessibility/security concerns, and other risks
that cheap automation does not already decide.

If a repository-wide gate is slow, externally metered, destructive, or otherwise
expensive, choose an integrated acceptance strategy proportionate to that cost instead
of duplicating the expensive gate.

## Runtime use

For repository work in Main, use `omp-workflow` as the default operating workflow.
Entering the workflow does not imply delegation. Route inside the workflow between
Main-direct execution, one bounded delegate, or parallel independent delegates.
Delegate when the work is cheaper to specify and verify than to perform in Main; retain
high-context judgment, integration, verification judgment, and final reporting in Main.

Select discovered custom agents by task shape and give delegated work clear intent,
boundaries, context references, and completion evidence. Reuse a coherent owner when
supported. Use bounded-executor for implementation and selective strong review for
important risks. Durable planning state is needed only when it supports continuity.

Self-hosting feedback is event-triggered, not a mandatory completion phase. If real work
already exposed concrete reusable omp-kit/OMP friction, Main may record the smallest
evidence-backed finding through the feedback mechanism when available. Do not create an
extra model turn, worker, scan, or tool call merely to look for feedback. Reporting
feedback never authorizes self-modification.
