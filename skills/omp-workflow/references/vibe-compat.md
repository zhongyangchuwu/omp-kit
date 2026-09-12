# Optional compatibility with built-in Vibe

Use this reference only when running OMP's built-in Vibe mode. The maintained
custom task agents are the normal kit workflow; these rules do not create a
replacement runtime or override the host's tool permissions.

Choose one initial tier per coherent workstream. Use fast for local/pattern-based
work and good directly for genuinely harder work. Do not start fast plus good
merely because the built-in prompt describes that as a normal concurrent shape.
Use multiple workers only for independent workstreams with non-overlapping writes.
The concrete model and effort come from config, not from this guide.

Reuse a persistent worker with `vibe_send` when its context remains appropriate.
When blocked, use `vibe_wait` with `timeout: 300` seconds, or up to 600 for a known
long operation. This is a maximum wait, not a fixed sleep. A timeout is not worker
failure. Continue waiting after a normal timeout unless evidence warrants steering;
do not repeatedly reason about an unchanged task or duplicate its investigation.

A good worker is not mandatory supervision for ordinary fast-worker output.
Select independent review based on failure cost and uncertainty, not every edit.
