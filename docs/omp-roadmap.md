# OMP Capability Roadmap

Current active scope: skills only.

The repository should not keep empty capability roots. Future surfaces are introduced only when there is a real artifact, a clear install path, and tests.

## Extensions

Create an extension root only when there is a maintained OMP extension module. OMP-native install paths are:

```text
~/.omp/agent/extensions/
<repo>/.omp/extensions/
```

Extension packages should prefer `omp.extensions` in `package.json`. Legacy `pi.extensions` is compatibility-only.

## Custom tools

Create a tool root only when deterministic local code exists and is tested without the model. OMP-native install paths are:

```text
~/.omp/agent/tools/
<repo>/.omp/tools/
```

Prefer wrapping tools through an extension when lifecycle hooks, commands, rendering, or policy interception are needed.

## MCP

Create MCP config or server files only when a reusable cross-client process boundary is useful. OMP-native config paths are:

```text
~/.omp/agent/mcp.json
<repo>/.omp/mcp.json
```

Use `.omp/mcp.json` when OMP owns the config. Use root `mcp.json` only for portable fallback configs shared with other clients.

## Packages

Create package metadata only when skills, extensions, tools, prompts, or themes need to be installed and versioned as a bundle. Until then, keep the repository as a direct skill kit.
