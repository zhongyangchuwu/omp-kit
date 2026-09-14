# Workflow Gates

## Pre-flight gate

Use a pre-flight gate before work starts. Check required inputs, permissions, artifacts, files, and verification paths before making changes.

A passing pre-flight gate names the inputs used and the output expected.

## Revision gate

Use a revision gate after producing a plan, implementation, review, verification record, or capture record. Route incomplete or inconsistent output back to the producer with concrete required changes.

A passing revision gate confirms the output is complete enough for the next phase.

## Escalation gate

Use an escalation gate when the workflow reaches a decision that automation cannot make safely. Present the concrete options, tradeoffs, and recommended default.

A passing escalation gate records the selected decision and the reason it matters.

## Abort gate

Use an abort gate when continuing would create damage, misleading output, or wasted work. Preserve current state and report the condition that must change before resuming.

A passing abort gate is not possible; the workflow stops with recoverable context.

## Gate placement

Apply gates at phase boundaries, before destructive operations, after review findings, after verification gaps, and before ship readiness.
