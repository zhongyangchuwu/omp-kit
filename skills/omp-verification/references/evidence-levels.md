# Evidence Levels

## Levels

- `Exists`: expected file, symbol, route, command, or artifact exists.
- `Implemented`: content is real implementation rather than a placeholder.
- `Wired`: implementation is connected to callers, configuration, UI, runtime, or documentation.
- `Functional`: behavior works when invoked through the relevant path.
- `Regression`: durable tests or checks cover the behavior.
- `UAT`: user-facing scenario is accepted or documented with gaps.

## Selection rule

Use the highest evidence level practical for the claim. Record lower-level evidence as incomplete when the claim requires runtime behavior.
