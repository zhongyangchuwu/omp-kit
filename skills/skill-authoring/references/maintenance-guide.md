# Maintenance Guide

Use this guide for long-term personal skill library care. Detailed workflows, resource schema, and daily operations are in `docs/workflows.md` and `docs/resource-model.md`.

## Metadata model

Every tracked resource has a `resource.yaml`:

```yaml
name: example
kind: skill
status: active
path: skills/example
source:
  type: self
risk:
  level: low
  reason: Instruction-only, no scripts, secrets, or external actions.
activation:
  mode: automatic
verification:
  commands: []
  notes: []
maintenance:
  last_reviewed: "YYYY-MM-DD"
  notes: []
relationships:
  extensions: []
  tools: []
  packages: []
  upstream: []
```

`registry.yaml` is generated from these files. Do not edit it by hand.

## When to update maintenance notes

Update `resource.yaml` maintenance notes when:

- you review a skill and confirm it is still accurate;
- you change the activation policy or risk level;
- you discover a false trigger, missed trigger, or unsafe instruction;
- you add or remove scripts, references, or verification commands;
- you promote a skill from incoming or localized.

## Update workflow

1. Identify what needs to change: stale docs, missing trigger, unsafe instruction, broken link.
2. Read the current `SKILL.md`, `resource.yaml`, and references.
3. Make the smallest coherent change.
4. Run `just build-registry`.
5. Run `just test`.

## Archiving

A skill should be archived when it is no longer correct, useful, or safe. Instead of a dedicated `archive/` directory, change the skill's `resource.yaml`:

```yaml
status: archived
```

And remove it from `skills/`. The archived source can be kept under `incoming/` or `localized/` for history. Do not leave obsolete skills in active scan paths.

## Quality checklist

Before declaring a skill ready:

- [ ] name matches directory
- [ ] description says what the skill does and when to use it
- [ ] `SKILL.md` is concise enough for activation-time loading
- [ ] references are linked from `SKILL.md` and exist
- [ ] scripts have `--help` and avoid secrets and unsafe defaults
- [ ] runtime-specific notes are isolated from portable guidance
- [ ] `resource.yaml` is complete and accurate
- [ ] `just test` passes
