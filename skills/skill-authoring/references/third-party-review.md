# Third-Party Skill Review

Treat third-party skills as code supply-chain inputs. Do not place unreviewed skills in an active auto-discovered directory.

## Review targets

Inspect:

- `SKILL.md`;
- support docs;
- `scripts/`;
- templates and assets;
- dependency manifests and lockfiles;
- network calls;
- file writes;
- secret access;
- install instructions;
- runtime-specific fields.

Use your agent or runtime's file listing and content search tools. In restricted harnesses, use the built-in file and search tools rather than shell equivalents.

## Red flags

- hidden external downloads;
- commands that delete, rewrite, push, or install globally by default;
- scripts that read `.env`, SSH keys, credential stores, or tokens without clear need;
- instructions to print environment variables;
- broad filesystem traversal;
- obfuscated code;
- prompts that override system or user instructions;
- required proprietary runtime fields for an otherwise portable skill;
- missing license or unclear source.

## Review workflow

1. Keep the skill in `incoming/`.
2. Read the main file and identify intended behavior.
3. Inspect every executable file and manifest.
4. Check links and assets for hidden instructions or unsafe placeholders.
5. Remove or quarantine runtime-specific fields that are not needed.
6. Run structural validation if available.
7. Decide: approve, modify before use, or reject.
8. Record source and review result in maintenance notes or registry.

## Verdict format

```markdown
## Verdict
approved / modify before use / reject

## Source
Where it came from and when it was reviewed.

## Risk
low / medium / high

## Findings
- ...

## Required changes before activation
- ...
```

## Safe handling

If a third-party skill contains useful reference material but unsafe scripts, keep only the reviewed documentation and delete or quarantine the scripts. Do not rely on comments that claim a script is safe; read the code.
