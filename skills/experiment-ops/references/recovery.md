# Recovery and Completion

Use this reference when a run appears stuck, failed, disappeared, needs resume/relaunch, or must be cancelled.

## Diagnose before relaunch

Before starting another run:

1. inspect durable backend state;
2. inspect recent logs;
3. inspect expected artifacts/checkpoints;
4. inspect relevant disk/GPU/resource state when it can explain failure;
5. establish whether the old run is active, terminal, or unknown;
6. then decide whether to wait, resume, relaunch, or cancel.

Do not duplicate a run merely because an agent/tool call timed out, SSH disconnected, or output paused.

## Preserve failure provenance

A failed run is evidence. Preserve its identity and reason when known. If a semantically relevant config, seed, input, preprocessing step, evaluation protocol, batch/precision setting, or recovery parameter changes, create a new run identity.

Resume the same run only when the project's checkpoint/restart semantics preserve the intended experiment identity and relevant configuration remains unchanged. A purely operational resubmission may keep the same identity when the project runner explicitly defines it that way.

## Execution failure vs research result

Dependency/import errors, CUDA/runtime mismatch, disk full, transient network/storage failure, permission errors, preemption, and provider interruption are execution failures. Do not interpret them as evidence that the research method failed.

## Cancellation

Before cancelling, confirm target/run identity and authority, prefer backend-native graceful cancellation, capture enough status/log evidence to explain the action, and verify terminal state afterward. Do not terminate unrelated jobs on a shared server.

## Completion and collection

Mark a run `COMPLETED` only when the backend/process is terminal and the expected result contract is present. Otherwise use a conservative state such as `FAILED`, `CANCELLED`, or `UNKNOWN`.

After terminal state, preserve relevant logs/artifacts, report final observed status and output locations, collect/pull artifacts when required, and hand off provider/compute/storage lifecycle separately.

Keep these lifecycles independent:

```text
run process
compute allocation/server state
storage/resource retention and billing
```

Use provider-specific skills for provider lifecycle and cost behavior rather than guessing from process state.
