# Personal Skills Index

Canonical source for maintained personal Agent Skills.

## Active skills

| Skill | Risk | Type | Verification |
| --- | --- | --- | --- |
| `autodl` | High | AutoDL Pro GPU resource and SSH operations helper | `skills-ref validate`, pytest, ruff |
| `skill-authoring` | Low | Portable skill authoring/reference guide | `skills-ref validate`, docs pytest |

## Layout

```text
skills/      Active maintained skills.
incoming/    Staging area for third-party or draft skills before review.
archive/     Retired skills kept for reference.
```

## Maintenance rules

- Treat this repository as the canonical source.
- Do not commit runtime caches, virtual environments, compiled Python files, secrets, tokens, SSH hosts, private key paths, or paid-resource identifiers.
- Validate each skill after edits using the commands recorded in `registry.yaml`.
- Review third-party skills in `incoming/` before moving them into `skills/`.
