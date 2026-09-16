# Skill Design

## Goal

Skills stay small, focused, and independently useful. Each skill owns one stable concern, exposes a precise activation description, and keeps detailed guidance behind progressive disclosure.

## Design principles

- Add a skill when it has an independent trigger, repeated use, stable scope, and a concise description that lets the runtime select it directly.
- Keep each skill centered on one owner domain. The domain should fit in one sentence: when the agent faces this task class, this skill provides the decision rules or workflow.
- Put reusable project facts in `docs/`; put task instructions and current boundaries in `SKILL.md` and focused skill-local support files. Let Git/PR history retain superseded lineage rather than duplicating it in a shadow metadata file.
- Let each skill stand alone. Skill selection comes from the `description`, not from a hand-written routing graph between skills.
- Prefer positive guidance: focus, rules, required checks, recommended defaults, and expected outputs.
- Keep `SKILL.md` as the control panel. Move long rubrics, examples, checklists, and detailed procedures into support files loaded only for the relevant task.
- Consolidate repeated guidance into one owning skill. Other skills keep their concern clear through their description and focus statement.

## Scope model

A skill's scope should be stable enough to survive changes in the current repository inventory. Define scope by concern, not by today's file list or implementation details.

Good scope boundaries are:

- task-centered: the skill activates for a recognizable class of work;
- reusable: the same guidance applies across multiple future tasks;
- separable: the skill can evolve without changing unrelated skills;
- compact: the main file remains short after extracting details;
- verifiable: changes to the skill can be reviewed against a clear purpose.

A new entity earns its place when existing concerns cannot absorb it without making their descriptions broader, their bodies longer, or their activation less precise.

## Description standard

A skill description carries the automatic routing contract. It should include:

- the action context: `Use when ...`;
- the owned task class;
- stable trigger terms an agent can match;
- the main decisions or outputs the skill provides.

Keep descriptions specific enough for runtime selection and broad enough to survive routine wording changes inside the skill.

## `SKILL.md` shape

Use a compact shape for maintained skills:

```text
# Skill Name

## Focus
One paragraph defining the owned concern.

## Activation
Positive trigger scenarios and task classes.

## Workflow
Three to seven ordered steps or decision rules.

## Rules
Small set of load-bearing requirements.

## Support files
Skill-local details and the exact situation that loads each one.
```

The headings are a default shape, not a required template. Preserve clarity over uniformity.

## Support files

Skill-local support files should each serve one job:

- one concept or workflow per file;
- clear title matching the task it supports;
- details that would make `SKILL.md` too long;
- examples, checklists, and longer rubrics scoped to the owner domain.

Support files are loaded by local need, not by cross-skill routing.

## Duplicate guidance

When the same rule appears in multiple places, keep one owner and remove copied detail elsewhere. Ownership follows the decision the rule supports:

- workflow cadence belongs with the workflow concern;
- quality judgment belongs with the review or implementation concern;
- ecosystem choices belong with the ecosystem concern;
- Skill lifecycle decisions belong with the library/authoring workflow that actually performs them;
- repository operation rules belong with the repository-operation concern.

Other skills express their own concern precisely through description and focus rather than pointing to another skill.

## Review checklist

Use this checklist before adding or expanding a skill:

- The skill has one owner domain.
- The description is specific enough for automatic selection.
- `SKILL.md` is a short control panel.
- Long detail lives in focused skill-local support files.
- Repeated guidance has one owner.
- Current-project facts live in `docs/`.
- Runtime-specific details live in runtime notes or localization support files.
- New entities have a real maintained artifact, install path, and verification path.
