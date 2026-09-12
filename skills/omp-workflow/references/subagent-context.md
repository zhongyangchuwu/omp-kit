# Subagent Context Policy

## Principle

The director should send intent and boundaries; workers should retrieve the context they actually need.

Do not copy the full parent conversation into every worker prompt when an authoritative context source is already available.

## Context levels

### Direct

Use for a small, explicit task that does not depend on prior discussion.

Provide the objective and any necessary scope or verification target. Do not ask the worker to read parent history.

### Referenced

Use when the assignment depends on decisions developed in the parent conversation.

Provide a short task intent and tell the worker to read the parent transcript, typically `history://Main` or the actual parent agent id, before editing.

The worker should normally read parent history once at the start of the workstream and then rely on its own persistent transcript. Re-read only when the parent has made materially new decisions.

### Explicit contract

Use for high-risk, ambiguous, or cross-subsystem work.

The director should provide explicit objective, scope, constraints, and acceptance criteria. Parent history remains supporting evidence rather than the task definition.

## Conversation authority

Conversation is evidence, not automatically a specification.

Interpret parent history in this order:

1. the user's latest explicit decisions and requirements;
2. earlier explicit user decisions not superseded later;
3. director conclusions explicitly accepted by the user;
4. repository facts and durable project rules;
5. tentative suggestions, brainstormed alternatives, and unresolved discussion.

Do not convert questions, rejected options, tentative recommendations, or unresolved disagreement into implementation requirements.

If a material decision remains unresolved after reading the transcript, return the ambiguity to the director instead of guessing.

## Context sources

Prefer the narrowest useful source:

- parent discussion: `history://<parent-agent-id>`;
- current worker's archived session context: worker-local history mechanisms;
- repository facts: source files and project docs;
- reusable procedure: relevant skill/reference;
- durable multi-session state: project planning/documentation artifacts when they actually exist.

Do not make the director paraphrase repository facts that the worker can read directly.

## Notes-backed main context

When the main session uses OMP's experimental notes-backed context windows, treat its notebook as main-session working memory and its raw archive as main-session-local. Workers still use the concise registered parent transcript through `history://<parent-agent-id>` unless OMP gains an explicit cross-agent full-history capability.

Restricted short-lived workers do not need to inherit the main session's context-management tool surface.
