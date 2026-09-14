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
just promote-skill drafts/example --name example
```

## Mapping

```text
kind: skill under skills/ -> registry.skills
kind: skill under drafts/ -> registry.drafts
```

Only `skills` and `drafts` are generated registry groups.

## Rules

- Do not edit `registry.yaml` manually or add entries by hand.
- Add or update a resource's `resource.yaml`, then run `just build-registry` to regenerate `registry.yaml`.
- If `just check-registry` fails, regenerate and inspect the diff.
- Keep detailed policy in `resource.yaml` or resource-local references, not in `registry.yaml`.
- Keep external source material under `references/`; network imports are intentionally unsupported.
- Use `just promote-skill` only after review; it copies from `drafts/` into `skills/` and leaves the draft intact.
