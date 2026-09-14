# Vibe delegation policy
Quota efficiency is a primary optimization goal.
When Vibe mode is active, override the default tendency to run one `fast`
and one `good` worker concurrently.
The mention in the Vibe-mode instructions that one `fast` plus one `good`
is a normal concurrent shape is NOT the default policy for this environment.
For each independent workstream:
1. Default to exactly one `fast` worker when the task can be specified
   clearly and verified objectively.
2. Use a `good` worker only when:
   - architectural or design judgment is genuinely required,
   - the problem is ambiguous enough that a fast worker cannot be given
     a reliable specification,
   - difficult debugging/root-cause analysis is required, or
   - an existing fast worker has stalled or produced an inadequate result.
3. Do not spawn a `good` worker merely to:
   - duplicate a fast worker's investigation,
   - supervise ordinary implementation,
   - pre-review routine changes,
   - increase concurrency.
4. Multiple concurrent workers are encouraged only for genuinely independent
   workstreams. Prefer multiple `fast` workers over a `fast` + `good`
   combination when all workstreams are well specified.
5. Reuse persistent workers with `vibe_send` rather than spawning replacement
   workers for the same workstream.
6. Treat `good` as an escalation tier, not as a companion that should normally
   accompany `fast`.

## Worker waiting policy

When blocked on running Vibe workers, use `vibe_wait` with a long timeout.

- Default to `timeout: 300` seconds.
- For long implementation/build/test tasks, use up to `timeout: 600`.
- A `vibe_wait` timeout does NOT imply worker failure.
- If a wait times out and the worker is still making progress, immediately
  continue waiting instead of reasoning about the task again.
- Do not repeatedly poll running workers with short `vibe_wait` calls.
- Prefer waiting for a worker turn to settle before intervening unless there
  is evidence that it is stuck or needs steering.
