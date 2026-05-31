# Abstraction Rules

Use this reference when deciding whether to introduce, keep, inline, or remove an abstraction.

## The abstraction must earn its keep

An abstraction is justified when it removes a real maintenance burden today:

- multiple current implementations share a stable interface;
- a public boundary must hide implementation details;
- a framework/runtime requires the shape;
- the abstraction names a domain concept that callers already reason about;
- it localizes a policy that would otherwise be duplicated or scattered.

An abstraction is suspect when it exists because code might need flexibility later.

In MVP-stage personal projects, be willing to refactor when it deletes concepts or clarifies ownership. Git rollback reduces the cost of failed refactors, but it does not prove behavior was preserved; verify exposed contracts after the change.

## Decision tree

### Interface / protocol / trait

Use one when:

- there are at least two current implementations; or
- tests need to replace a true external boundary; or
- the public API needs a stable seam across packages/processes.

Do not use one when:

- there is one implementation in the same module;
- the interface only mirrors the concrete class;
- callers immediately downcast or reach through it.

### Helper function

Extract when:

- the name captures a real domain concept;
- the logic is repeated with the same semantics;
- extraction makes the caller read at a higher useful level;
- the helper owns a tricky invariant and can be tested directly.

Inline when:

- it is used once and only shortens code mechanically;
- readers must jump away to understand simple logic;
- the helper name is vague (`handle`, `process`, `doThing`, `utils`).

### Strategy / policy object

Use when:

- behavior varies along a stable axis;
- each variant has enough logic to deserve a name;
- callers should not know concrete variant details;
- adding a variant should not touch high-risk central logic.

Do not use when:

- there are only one or two simple branches;
- the strategy object only wraps a function call;
- the variation axis is still changing every feature.

### Factory

Use when construction has meaningful policy:

- selecting implementation by environment or capability;
- validating/normalizing construction inputs;
- hiding setup order or resource acquisition;
- returning cached/shared instances deliberately.

Do not use when it only calls a constructor.

### Repository / service layer

Use when:

- persistence details would otherwise leak into domain logic;
- multiple callsites need the same query/update semantics;
- transactions or consistency rules need one owner.

Do not use when:

- it becomes a pass-through wrapper over an ORM;
- every method mirrors a single query with no policy;
- domain behavior is split so callers must orchestrate invariants manually.

### Event bus / pub-sub

Use when producers and consumers are genuinely decoupled and eventual handling is acceptable.

Do not use when explicit function calls would be clearer, ordering matters, or failures must be observed synchronously.

## Deletion prompts

Before keeping any abstraction, answer:

- What current caller becomes simpler because this exists?
- What invariant is now localized?
- What implementation detail is hidden from a real consumer?
- What code would become more duplicated if this were removed?
- Can a maintainer find the real behavior in one jump?

If the answers are weak, inline or delete it.

## Pattern humility

Patterns are vocabulary, not goals. Prefer the language and framework's ordinary idioms. A small explicit branch is usually better than a miniature framework.
