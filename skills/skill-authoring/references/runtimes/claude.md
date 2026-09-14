# Claude Runtime Notes

These notes are environment-specific. Do not treat them as portable Agent Skills requirements.

## What to remember

Claude products support skills as folders of instructions, scripts, and resources loaded when relevant. Claude Code may expose product-specific installation and management flows. Claude also has a `skill-creator` pattern that asks about a workflow, generates folder structure, formats `SKILL.md`, and bundles needed resources.

## How to use this information

Use Claude's `skill-creator` as a design reference for interactive authoring:

- ask what workflow the skill captures;
- ask when it should trigger;
- decide whether it needs references, assets, or scripts;
- generate files;
- package resources.

Do not copy Claude-specific assumptions into portable skills by default.

## Avoid in portable output

- Claude Code commands, hooks, or product-specific install steps;
- assumptions about Claude's UI or API;
- runtime-only permission fields unless the user targets Claude specifically.

If the user explicitly targets Claude Code, document that choice in a runtime section rather than in portable standard guidance.
