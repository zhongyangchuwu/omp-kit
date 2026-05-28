# Maintenance Guide

Use this file for long-term personal skill library care.

## Suggested library structure

```text
personal-skills/
  README.md
  registry.yaml
  SKILLS_INDEX.md
  skills/
  incoming/
  archive/
```

- `skills/`: active reviewed skills.
- `incoming/`: downloaded or generated skills awaiting review.
- `archive/`: retired skills kept for history.
- `registry.yaml`: inventory of source, risk, status, and review date.
- `SKILLS_INDEX.md`: human and fallback agent index.

## Registry fields

```yaml
skills:
  skill-authoring:
    status: active
    source: self
    risk: low
    last_reviewed: "2026-05-28"
    notes: Portable authoring lifecycle guidance.
```

## Maintenance notes

Use [maintenance-notes-template.md](../assets/maintenance-notes-template.md) for important skills. Track:

- status: active, experimental, archived;
- source: self, vendor, third-party, project extraction;
- risk: low, medium, high;
- last review date;
- known issues;
- quality checklist;
- eval history.

## Update workflow

1. Identify why the skill needs change: stale docs, false trigger, missed trigger, unsafe instruction, missing eval, poor output, broken link, or runtime drift.
2. Read the current skill and maintenance notes.
3. Add or update an eval if behavior changes.
4. Make the smallest coherent change.
5. Validate frontmatter and links.
6. Run evals or relevant manual scenarios.
7. Update notes and registry.
8. Archive obsolete alternatives.

## Archiving

Archive a skill when:

- its task is no longer relevant;
- it duplicates a better skill;
- its sources are stale and cannot be verified;
- it requires unsafe or unavailable tooling;
- it triggers too broadly and cannot be narrowed without losing value.

Move it to `archive/` and record the reason. Do not leave obsolete skills in active scan paths.

## Tool information

Portable validation can use `skills-ref validate` when available. Ecosystem installation and multi-agent management tools are useful but not standards; keep their notes in runtime-specific files and review generated or downloaded content before activation.
