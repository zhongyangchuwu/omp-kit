# Scripts Guide

Default to instruction-only. Add `scripts/` only when executable logic is more reliable than repeated agent reasoning.

## Add scripts when

- parsing or transforming files repeatedly;
- validating structured output;
- generating deterministic artifacts;
- wrapping a fragile API call;
- checking skill structure mechanically;
- the agent keeps reinventing the same helper.

Do not add scripts for judgment calls, broad research, or one-off operations.

## Script interface rules

A bundled script should:

- provide `--help`;
- avoid interactive prompts;
- accept input through flags, files, stdin, or environment variables;
- use safe defaults;
- support `--dry-run` for state-changing work;
- write structured data to stdout when practical;
- write diagnostics to stderr;
- return meaningful exit codes;
- avoid printing secrets;
- avoid overwriting files unless an explicit output path or confirmation is provided.

## Dependency strategy

Prefer the smallest reliable dependency set:

| Scope | Strategy |
| --- | --- |
| Small Python helper | stdlib first; PEP 723 inline dependencies only if needed |
| Complex reusable tool | mini package with `pyproject.toml`, lockfile, and tests |
| Existing formatter/linter | call the external tool with a pinned version if the user environment supports it |

Document prerequisites in the skill body or a reference file. Do not assume a runtime has Node, Python packages, network access, or a package manager.

## When scripts need tests

If a script can change files, parse inputs, call APIs, or validate outputs, add tests. A script without tests is only acceptable for tiny glue that is obvious and non-destructive.

## Script entry documentation

List scripts in `SKILL.md` or the relevant reference:

```markdown
## Available scripts

- `scripts/check_skill.py` — Validates frontmatter, local links, and portable-field constraints.
```

Then show the safest invocation:

```bash
python scripts/check_skill.py --skill-dir ./skills/example --json
```

## Avoid

- downloading remote code during normal skill use;
- hidden network calls;
- shell commands that delete, push, or rewrite state by default;
- prompts waiting for input;
- logs that include tokens, passwords, private paths, or environment dumps.
