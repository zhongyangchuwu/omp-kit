# OMP-First Simplification Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this design task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the repository to a small OMP-first skill kit: active resources are skills and drafts, project facts live in `docs/`, and installation targets OMP's native user directory.

**Architecture:**
The repository should keep one active capability surface: `skills/` for installed skills and `drafts/` for in-progress skills. Everything else that used to imply future capability types should either disappear or move into documentation as a roadmap, not as tracked empty directories. The install workflow should link active skills into `~/.omp/agent/skills`, matching OMP's native discovery layout. The metadata/registry model should stop advertising unused resource groups so the generated index stays small and honest.

**Tech Stack:** Python, YAML, Justfile, pytest, OMP documentation, repository docs.

---

## Problem Statement

The repository still carries legacy surface area from a broader Pi/OMP capability model: empty reserved directories, registry groups for unsupported resource kinds, and install defaults that point at the old agent layout. The result is extra maintenance cost and unclear ownership of where project facts belong.

## Design Principles

- Keep one canonical active path for each capability.
- Prefer deletion over abstraction when a surface is unused.
- Put project-specific facts in `docs/`, not in workflow skills.
- Make install behavior match OMP's native discovery path.
- Preserve active skills and drafts; remove or document everything else.

## Target Shape

- Active tracked resources: `skills/` and `drafts/` only.
- Generated registry groups: `skills`, `drafts`.
- Resource metadata kind: `skill` only.
- Install target: `~/.omp/agent/skills`.
- Project overview docs: concise OMP-first architecture, workflow, resource model, installation, and roadmap notes.
- No tracked empty roots for extensions, tools, packages, mcp, or vendor.

## Scope

In scope:
- resource metadata and registry generation
- install script and justfile entry points
- repository docs and README cleanup
- removal of empty reserved directories
- tests that enforce the smaller model

Out of scope:
- adding real OMP extensions, tools, packages, or MCP servers
- compatibility shims for the old layout
- changing the `omp-superpowers` workflow skill to carry project facts

## Verification

- `just test`
- `just build-registry`
- `just check-registry`
- direct script smoke checks for registry and index generation
- confirm the install command links skills into `~/.omp/agent/skills`

## Notes

The repository may still describe future OMP capability types in docs, but only as roadmap material. Those types should not appear as active top-level resource groups until real tracked resources exist.
