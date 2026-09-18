# Assurance observed action facts v2

Assurance derives deterministic facts from structured tool contracts. The fact layer
records **where** an action was directed, **what kind of operation** the tool contract
exposes, and **what kind of resource** it addresses. These are independent observations.

They are not authorization, task intent, safety, risk, or correctness judgments.

```text
observed boundary   where available evidence says the action was directed
observed operation  read | write | execute | unknown
observed resource   filesystem | service | version-control | ...

requested scope     what the user asked for          (not inferred here)
authorized scope    what the user/runtime permitted  (not inferred here)
```

## Independent fact dimensions

A classified action can produce three independent observation sets:

| Fact | Values |
| --- | --- |
| boundary | `workspace`, `host-user`, `host-system`, `external`, `unknown` |
| operation | `read`, `write`, `execute`, `unknown` |
| resource | `filesystem`, `process`, `configuration`, `package`, `version-control`, `service`, `network`, `unknown` |

The persisted fact model does not keep one tuple containing all three dimensions.
It records `BoundaryObservation`, `OperationObservation`, and `ResourceObservation`.
Each observation has action identity, track position, classifier provenance and evidence.

A classifier may still return one compact internal descriptor because the tool contract
is parsed once. The derivation layer immediately projects that descriptor into the
three independent observations before rules consume it.

## Correlation without semantic coupling

Some tools expose more than one effect. GitHub `pr_checkout`, for example, can describe:

```text
external  + read  + service
host-user + write + filesystem
```

Joining facts only by `actionId` would create a false Cartesian product. Therefore
facts projected from one classifier descriptor share an opaque `groupId`.

`groupId` means only that those independent facts came from the same structured
classifier descriptor. It is provenance/correlation, not a policy category.

## Acquisition and coverage

Full enrichment uses the existing public OMP trace/session surfaces:

```text
trace tool identity
  -> selected session entries
  -> matching structured toolCall
  -> pure action classifier
  -> boundary / operation / resource observations
```

Raw arguments, contents, paths, URLs, queries and repository names are not copied
into the action-fact report. Failed or unsupported classification remains unclassified.

The three dimensions share one classification-coverage record because they come from
the same bounded structured-tool pass. Coverage is not copied three times merely
because the semantic dimensions are separate.

## Built-in contracts

File/search tools derive target boundary, operation (`read` or `write`) and filesystem
resource facts. GitHub operations derive external/service or version-control facts;
`pr_checkout` emits a separate external-read group and host-user-write group.
`web_search` derives `external`, `read`, and `service` facts.

Generic shell/eval semantics remain deliberately unclassified. `execute` is not
automatically promoted to `write`, and unknown transitive side effects remain a
Visibility limitation rather than a guessed operation.

## Human-facing presentation

The full report presents the dimensions independently:

```text
Boundaries
  workspace, external

Operations
  read, write

Resources
  filesystem, service
```

This does not imply `external => risky`, `write => unsafe`, or `read => harmless`.

## `omp-kit.scope-expansion@2`

`scope-expansion` consumes **boundary observations only**. A later first appearance
of another non-unknown boundary on the same track becomes supporting Evidence.
It does not inspect operation type.

## `omp-kit.cross-boundary-write@1`

`cross-boundary-write` is a separate policy-composition rule. It creates Attention only
when a newly observed `host-user`, `host-system`, or `external` boundary has a
`write` operation in the same `groupId`.

It deliberately does not promote read-only boundary expansion, `execute`, `unknown`
operation type, or workspace-local writes.

This still does not claim that the write was unauthorized, unsafe, malicious, or
outside user intent. It is a conservative human-attention policy over observed facts.

## Retained runtime facts

`/assurance full` derives the same independent dimensions from retained Main-session
structured tool calls where supported. Rewind preserves off-branch facts because
conversation rewind does not roll back already executed effects.

## Explicit limitations

Current limitations include declared-target-only classification, unclassified generic
shell/eval semantics, unverified symlink targets, unavailable child workspace roots,
and unavailable causal ordering across concurrent tracks.

The layer intentionally does not perform requested-scope inference, authorization
checking, severity/risk scoring, arbitrary shell side-effect analysis, or model-based
classification.

## Design boundary

```text
Raw OMP evidence
      ↓
structured tool classification
      ↓
independent base facts
  boundary
  operation
  resource
      ↓
conservative rule composition
      ↓
Evidence / Attention / Visibility
```

Fact derivation may happen together for efficiency. Semantic ownership and rule
consumption remain separate.
