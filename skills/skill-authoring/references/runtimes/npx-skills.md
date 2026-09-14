# npx skills Notes

These notes describe an ecosystem CLI. The CLI is useful, but it is not the Agent Skills standard itself.

## Common commands

```bash
npx skills init my-skill
npx skills add owner/repo --list
npx skills add owner/repo --skill skill-name
npx skills list
npx skills find query
npx skills update
npx skills remove skill-name
```

## Use cases

- bootstrap a template with `npx skills init`;
- inspect available skills in a repository;
- install selected skills into supported agent directories;
- list, update, or remove installed skills.

## Safety stance

Treat `npx skills add` as a downloader and installer, not a trust decision. Review third-party skills before activation. Prefer a gitignored `references/` source copy, then extract reviewed material into `drafts/` before promotion.

## Portability notes

- Generated templates may need adjustment to match your naming and documentation standards.
- Multi-agent install paths are runtime-specific.
- Symlink vs copy behavior is an operational choice, not part of the skill format.
- `npx skills` should not be a prerequisite for using a portable skill.
