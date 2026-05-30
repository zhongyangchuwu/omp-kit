# Incoming Resources

Third-party and imported resources in this directory are quarantined by default. They must not be linked into active skill scan paths until reviewed and promoted.

Per-resource metadata now lives in `resource.yaml` files:

| Resource | Metadata | Status |
| --- | --- | --- |
| `anthropic-skills` | `incoming/anthropic-skills/resource.yaml` | staged |
| `claude-plugins-official` | `incoming/claude-plugins-official/resource.yaml` | staged |
| `superpowers` | `incoming/superpowers/resource.yaml` | localized source copy |

Useful commands:

```bash
just scan-risk incoming/<name>
just build-registry
just check-registry
just test
```

Promotion remains manual until `scripts/import_skill.py` and `scripts/promote_skill.py` are implemented. Review every `SKILL.md`, executable file, dependency manifest, runtime-specific field, duplicate name, and license before moving content into active resource directories.
