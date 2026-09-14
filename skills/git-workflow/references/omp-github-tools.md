# OMP GitHub Tools

## Principle

Use OMP GitHub and internal URL tools for GitHub operations when they cover the task. Use local Git commands for local repository state, branch switching, staging, commits, and local cleanup.

## Repository and PRs

- View repository metadata with `github repo_view`.
- Create pull requests with `github pr_create`.
- Read pull request state with `read pr://N?comments=0`.
- Read pull request diffs with `read pr://N/diff`, `read pr://N/diff/<i>`, or `read pr://N/diff/all`.
- Checkout pull requests for review with `github pr_checkout`.
- Push changes to checked-out pull request branches with `github pr_push`.

## CI

- Watch the current commit or a specific workflow run with `github run_watch`.
- Read failed job logs before changing code.
- Fix root causes and observe the updated run before merge.

## Search

Use GitHub search operations for GitHub-side discovery:

- `github search_prs` for pull requests;
- `github search_issues` for issues;
- `github search_commits` for commits;
- `github search_code` for hosted code;
- `github search_repos` for repositories.

## Local Git state

Use local Git state checks for:

- current branch;
- dirty tracked files;
- staged changes;
- untracked files;
- branch switching;
- staging and commits;
- local branch deletion;
- local worktree cleanup.

Use the dedicated file and content tools for repository reads, searches, and edits. Use Git commands for Git state and mutation.
