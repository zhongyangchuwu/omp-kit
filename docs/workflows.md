# Maintenance workflows

## Install and update

Use install.sh, install.ps1 or `uv run --script scripts/install_harness.py`.
The default copies config, agents and registry-selected active skills. Preview first
on existing machines and explicitly adopt collisions with --force after reviewing
the planned paths. See omp-installation.md for backups, drift and rollback.

Intended personal policy changes go into tracked config or the owning skill. Host
URLs/UI deviations go into private local overlays or named profiles. Credentials go
into the launching environment or agent-root .env, never tracked YAML.

## Skill lifecycle

Review third-party material in gitignored references/, extract maintained work into
drafts/, and promote deliberately using the existing promote-skill helper. Preserve
resource.yaml provenance/risk/verification metadata. Regenerate registry.yaml with
scripts/build_registry.py after resource metadata changes; do not hand-maintain it.
Drafts are never installed. The existing registry validation and risk scan remain.

## Coherent implementation batches

Complete a bounded set of related changes before running combined repository checks.
Check source/role/skill references, registry drift, tests and whitespace. Record actual
results and runtime gaps. A new installer behavior should cover destructive/recovery
boundaries, not generate a large test framework for every prose edit.

## Runtime use

Load omp-workflow for multi-step or delegated work. Select a discovered custom agent,
provide intent/boundaries and relevant context references, and reuse a coherent owner
when supported. Use bounded-executor for implementation and selective strong review
for important risks. Durable planning state is needed only when it supports continuity.
