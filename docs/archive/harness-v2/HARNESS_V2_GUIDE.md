# Harness v2: current operating guide

## Status and authority

This guide describes the implemented configuration/agent/workflow layer. The
2026-09-12 uploaded working settings are authoritative over earlier illustrative
YAML in the conversation. See `omp-configuration.md` and the migration record for
exact differences. Model superiority, token ratios and weekly capacity discussed
earlier are not validated implementation contracts.

## Resource boundaries

| Resource | Responsibility |
| --- | --- |
| package.json | Native OMP plugin identity and distributable resource roots |
| agents/*.md | Model-neutral task roles with restricted tool surfaces |
| skills/* | Workflow, execution, test and review behavior |
| rules/omp-kit-workflow.md | Main-only native workflow entry point |
| config/config.yml | Legacy installer model roles and portable runtime preferences |
| config/models.yml | Legacy installer provider routes and model metadata |
| config/APPEND_SYSTEM.md | Legacy installer copy of the workflow entry point |
| Project rules/docs | Repository facts and accepted local decisions |
| .omp-kit/local | Private legacy-installer overrides, not checked into Git |

The native plugin uses the repository resource roots directly and leaves ordinary OMP
settings untouched. The existing registry/provenance machinery still owns active skill
selection and drafts. The Python installer remains a compatibility/migration path that
copies config, agents and registry-selected skills and checks their references.


## Division of work

The main director owns user intent, interfaces, decomposition, unresolved decisions
and integration. Execution workers read source, edit, test and repair within a bounded
scope. The legacy Harness v2 configuration retains the tested Sol/Luna routing as
migration evidence, but the native plugin does not require that mapping.

`luna-code`, `luna-deep`, `luna-doc`, and `sol-review` retain their established names
while the plugin architecture changes. Their definitions are model-neutral: native
`task.agentModelOverrides`, configured through `/agents`, wins when present; otherwise
OMP uses the normal task/session model fallback. Concrete provider, model and effort
remain user-owned.

Workers have explicit tools and no child-spawn policy. Code workers have write and
execution capability; docs workers cannot run tests; reviewers cannot edit or run
a Git diff and need a supplied change artifact. Permission restriction is not a
filesystem/network sandbox, especially when bash is present.

Custom agents still use OMP's base child-session machinery. This is a restricted-tool
harness, not proof of a minimal replacement system prompt or improved benchmark score.

## Context transfer

Send immediate task intent and boundaries. Use direct briefs for small tasks,
referenced parent history for discussion-derived changes, and explicit acceptance
contracts for risky/ambiguous work. A worker should not repeatedly load all history.

The latest accepted user requirements determine scope. Retrieved history and summaries
are evidence, not new authorization, and facts still need source/test support. Mark
rejected alternatives and open questions. Escalate material ambiguity instead of
turning an assistant suggestion into a requirement.

`history://Main` is available only when that id resolves from the current caller/session
root. Live registry membership is one possible source, but it does not guarantee that an
arbitrary older session or unrelated project transcript is discoverable. It also does not
expose this separate ChatGPT conversation. Use the checked-in guide and handoff as the
durable entry point for a new OMP session.


## Execution and review

Use one owner per writable scope and parallelize independent work. The configured
maxConcurrency=4 is a limit, not a target to fill. Reuse an available persistent worker
through the actual runtime schema; do not invent hub commands or assume cold revival.

A worker handles ordinary errors. Two materially different failed approaches to the
same blocker trigger an evidence report; the director can respecify, split or escalate.
Verification is required, but rereading or rerunning all work for confidence is not.
The director owns final verification and may delegate its command execution.

Invoke an independent strong reviewer for material security, persistence, concurrency,
API or cross-system risks. Supply the diff, requirements and evidence. A review with
no findings is not proof that there are no bugs; report scope and uncertainty.

## Context maintenance

The imported default enables experimental notes-backed windows. It keeps a notebook,
recent context and retrievable older history; notebook quality/timing is still the
writing agent's responsibility. The full-history route is session-local, not a
cross-agent raw-history API. Restricted workers lacking required context tools use
legacy maintenance. No context-curator service is implemented here.

The base legacy chain remains remote -> soft. Soft summarization can use the configured
Luna target and inherits the calling path's effort behavior. Remote compaction support
is provider/route dependent. `legacy-context` disables experimental notes and chooses
shake -> soft as an explicit profile. Neither configuration promises lossless summaries
or a particular cache/quota improvement.

## Built-in Vibe compatibility

Custom ordinary task agents are preferred, but the uploaded fast/good model overrides
remain available. When built-in Vibe is explicitly used, load `vibe-compat.md`: do not
pair fast and good for its own sake, reuse coherent workers, and use long supported
wait timeouts rather than repeated supervisor polling.

## Portable operation

Canonical source -> optional config profiles -> machine-local overrides -> managed
runtime copies. The installer tracks what it owns, checks all conflicts first, backs
up replacements and supports rollback. Auth state and project/system dependencies
are not a portable part of this repository. See installation documentation before
adopting an existing runtime with `--force`.

Use `--config-profile` for omp-kit overlays; `--profile` is its compatibility alias.
Use `--omp-profile <name>` for a native OMP profile at
`~/.omp/profiles/<name>/agent`, then launch with `omp --profile <name>`. Full custom
agent discovery is supported for `~/.omp/agent` and native profile roots. An
arbitrary `PI_CODING_AGENT_DIR` can relocate OMP state but is not a full Harness v2
root on OMP 18.1.18; doctor reports that topology as incomplete when custom agents
are managed.

Use normal development and existing stats for feedback. Separate model requests,
provider retries, repair loops, review findings, human interventions and elapsed time.
Do not require a bespoke benchmark project before using the harness.
