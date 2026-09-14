# Execution and verification

Begin from the immediate objective, constraints and required evidence. Make the smallest complete in-scope change and use the narrowest check that can falsify it while implementing.

## Ownership

Workers verify their assigned scope and return concrete evidence. Main owns integration and final acceptance judgment.

When a shared interface/type/configuration contract changes, account for likely consumers before acceptance. Workers report out-of-scope consumers rather than silently expanding writable scope.

## Deterministic acceptance

Do not run the same repository-wide gate in every worker merely because it is cheap. After related writes settle, the accepted candidate receives the repository's normal integrated gate.

For omp-kit the current gate is:

```sh
bun install --frozen-lockfile
bun run verify
```

GitHub Actions runs it on the current PR merge-ref and, after an authorized landing, on `main`. Passing current PR CI replaces a routine local duplicate of the same full gate.

Rerun focused checks during repair when useful. If integration or review changes the candidate, its new CI run is new evidence; an unchanged successful candidate does not need another identical full pass solely because ownership or workflow phase changed.

## Runtime / external evidence

Repository CI does not establish machine-specific OMP/profile/provider behavior or external system state. When a claim depends on them, use the relevant released-runtime smoke or external read-back instead of pretending a repository test answers that question.

## Strong review

Independent review is conditional on consequence, ambiguity and the value of a second judgment. When practical, review a mechanically clean integrated diff. Use model review for semantics, lifecycle, security/authority, product intent and cross-slice reasoning that deterministic tests do not already decide.

Use `bounded-executor` for repair/stop behavior. Repeated failed variants without new evidence should escalate rather than consume more autonomous turns.
