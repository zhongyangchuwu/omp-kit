# Commit Messages

## Format

Use Conventional style with practical semantics:

```text
<type>(<scope>): <summary>

<body>

<footer>
```

Type and summary are required. Scope is optional. Body is expected for non-trivial changes. Footer is reserved for structured metadata.

## Types

```text
feat      user-visible capability or new maintained behavior
fix       bug fix or incorrect behavior correction
docs      documentation-only change
refactor  behavior-preserving restructuring
test      test additions or test-only changes
chore     maintenance metadata, registry, dependencies, repo upkeep
ci        CI workflow or automation gate changes
build     packaging, build system, lockfile, dependency resolution
perf      measurable performance improvement
revert    revert a previous change
```

## Scope

Use scope when it clarifies a stable affected area. Leave scope out when it would be guessed, noisy, or unstable.

Examples:

```text
docs(skill-design): define owner-domain rules
chore(registry): regenerate resource index
fix(scripts): preserve draft resource paths
```

## Summary

Use a short imperative summary:

```text
<type>(<scope>): <summary>
```

Rules:

- use lowercase type;
- say the result, not the activity;
- keep the subject short, roughly 72 characters;
- leave off the final period.

Examples:

```text
docs: define skill design principles
refactor: simplify superpowers control panel
fix: validate draft resource metadata
test: cover stale registry detection
```

## Body

Use the body for non-trivial changes to explain:

- why the change exists;
- what decision, behavior, or boundary it sets;
- what compatibility, maintenance, or user impact it has;
- what verification was run.

Example:

```text
docs: define compact skill design principles

The skill docs now describe owner-domain boundaries, description-based
activation, and progressive disclosure without listing volatile resource names.

This keeps repository-level documentation stable while individual skills own
their focused behavior.

Verified with just test.
```

## Footer

Use structured footers when true:

```text
BREAKING CHANGE: ...
Fixes: #123
Refs: #123
Co-authored-by: Name <email>
Signed-off-by: Name <email>
Release-As: 1.2.3
```

Breaking changes include the impact and migration path.

## Atomicity

One commit is one logical change. Tests and generated outputs can share a commit when they directly support the same logical change. Unrelated formatting, refactors, docs, and behavior changes stay separate.
