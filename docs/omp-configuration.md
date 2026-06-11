# OMP Configuration Notes

This project is OMP-first. Current repository automation only installs skills; other OMP capability paths are documented for future use.

## User-level paths

```text
~/.omp/agent/config.yml
~/.omp/agent/skills/<name>/SKILL.md
~/.omp/agent/extensions/
~/.omp/agent/tools/
~/.omp/agent/mcp.json
```

## Project-level paths

```text
<repo>/.omp/config.yml
<repo>/.omp/skills/<name>/SKILL.md
<repo>/.omp/extensions/
<repo>/.omp/tools/
<repo>/.omp/mcp.json
```

## Current policy

- Active skills install to `~/.omp/agent/skills/`.
- Draft skills remain in `drafts/` and are not installed.
- Project-specific facts stay in `docs/`.
- `omp-superpowers` stays workflow-only and should not carry this repository's configuration details.
- Extension, tool, MCP, and package roots are created only when real maintained artifacts exist.

## Source docs

Check current OMP docs before implementing runtime integrations:

- `omp://skills.md`
- `omp://extension-loading.md`
- `omp://custom-tools.md`
- `omp://mcp-config.md`
- `omp://config-usage.md`
