# Configuration ownership

OMP owns normal settings, model/provider routes, profiles, credentials, MCP settings and runtime defaults. The native omp-kit plugin adds resources; it does not copy a canonical personal provider setup into the user's configuration.

## Repository-owned

- `package.json`: native package metadata and dependency pins.
- `agents/`: task roles, declared tool surfaces and Skill autoloading.
- `skills/`: maintained task guidance and local support resources.
- `rules/`: Main workflow activation.
- `extensions/feedback.ts`: bounded feedback behavior.
- `extensions/assurance.ts`: current-session `/assurance` and `/assurance full` review entry points.
- `src/` and the session CLIs: derived evidence and assurance behavior.

Core Harness, Experience Skill and Integration categories are architectural descriptions only. They do not configure OMP or grant permissions.

## Machine/project-owned

Model IDs, service endpoints, tokens, credential databases, profile selection, MCP connections and provider costs belong to the actual OMP environment. Read the installed runtime's public docs/schema before changing them. Core agent definitions remain model-neutral.

Do not commit credentials, real AutoDL secrets files or private machine paths to make an example reproducible. Integration Skills carry their own setup/safety guidance; discovery does not authorize running them.

## Legacy snapshot retirement

The old tracked `config/` snapshot and its installer are removed from the current source tree. This is not an instruction to delete the user's installed configuration. See [installation and migration](omp-installation.md).

Version-sensitive runtime changes follow [OMP compatibility](omp-compatibility.md). Keep accepted repository policy in current docs and actual machine overrides outside Git.
