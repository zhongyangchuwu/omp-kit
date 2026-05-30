# Incoming Resources

Third-party and imported resources in this directory are quarantined by default. They must not be linked into active skill scan paths until reviewed and promoted.

Per-resource metadata now lives in `resource.yaml` files:

| Resource | Metadata | Status |
| --- | --- | --- |
| `anthropic-skills` | `incoming/anthropic-skills/resource.yaml` | staged |
| `claude-plugins-official` | `incoming/claude-plugins-official/resource.yaml` | staged |
| `superpowers` | `incoming/superpowers/resource.yaml` | localized source copy |

Promoted localized skills:

| Skill | Source | Active path |
| --- | --- | --- |
| `doc-coauthoring` | `incoming/anthropic-skills/skills/doc-coauthoring` | `skills/doc-coauthoring` |

Useful commands:

```bash
just import-skill /path/to/local/source --name <name>
just promote-skill incoming/<name> --name <name>
just scan-risk incoming/<name>
just build-registry
just check-registry
just test
```

`scripts/import_skill.py` imports local directories into `incoming/` and creates staged `resource.yaml` metadata. `scripts/promote_skill.py` copies reviewed incoming/localized skills into `skills/` without deleting the source copy. Review every `SKILL.md`, executable file, dependency manifest, runtime-specific field, duplicate name, and license before promotion.
