# Registry Generation

`registry.yaml` is a committed generated index. It exists for fast browsing, diffs, and simple agent lookup, but it is not hand-maintained.

## Source of truth

```text
*/resource.yaml -> scripts/build_registry.py -> registry.yaml
```

Each `resource.yaml` contributes one entry to the generated registry:

```yaml
skills:
  example:
    status: active
    risk: low
    path: skills/example
```

The generated registry contains only `status`, `risk`, and `path`.

## Commands

```bash
just build-registry    # overwrite registry.yaml from resource.yaml files
just check-registry    # fail if registry.yaml is stale
just validate-registry # validate generated registry and resource metadata
just test              # repository gate, includes registry checks through pytest
```

## Mapping

```text
kind: skill     -> registry.skills
kind: extension -> registry.extensions
kind: tool      -> registry.tools
kind: package   -> registry.packages
kind: incoming  -> registry.incoming
kind: import    -> registry.imports
```

## Rules

- Do not edit `registry.yaml` manually.
- Add or update a resource's `resource.yaml`, then run `just build-registry`.
- If `just check-registry` fails, regenerate and inspect the diff.
- Keep detailed policy in `resource.yaml` or resource-local references, not in `registry.yaml`.
