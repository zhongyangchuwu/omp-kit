# Assurance observed scope v1

Scope V1 is a deterministic fact layer for session assurance. It records which
resource boundaries and access classes are supported by the evidence currently
available to omp-kit. It does **not** decide whether those actions were requested,
authorized, safe, appropriate, or correct.

The three concepts remain separate:

```text
observed scope   what the available runtime evidence shows
requested scope  what the user asked for                (not inferred in V1)
authorized scope what the user/runtime permitted        (not inferred in V1)
```

A scope expansion therefore means only that a previously unseen boundary first
appeared later on one ordered trace track. It is not a violation, escalation, or
risk score.

## Fact model

A classified action may emit one or more `ScopeObservation` facts with three
orthogonal dimensions:

| Dimension | V1 values |
| --- | --- |
| boundary | `workspace`, `host-user`, `host-system`, `external`, `unknown` |
| access | `read`, `write`, `execute`, `unknown` |
| resource | `filesystem`, `process`, `configuration`, `package`, `version-control`, `service`, `network`, `unknown` |

These values are descriptive categories, not an ordering. For example,
`external.read` is not declared safer or more dangerous than `host-system.read`.

Every scope observation retains an assurance evidence reference and the classifier
identity/version that produced it. Raw command arguments, file contents, URLs,
queries, repository names and paths are not copied into the scope report.

## Acquisition boundary

OMP remains the raw evidence owner. Scope enrichment uses the public stats/session
surfaces already shared by assurance:

```text
OMP active-branch trace
  -> tool span identity
  -> selected /api/session/entry reads
  -> bounded parent walk to the matching assistant toolCall
  -> structured tool name + arguments (in memory only)
  -> pure scope classifiers
  -> bounded ScopeObservation facts
```

OMP 18.2.0 records a terminal tool result separately from the assistant entry that
contains the original structured tool call. The adapter therefore follows at most
eight parent links from a span's selected entry and matches the native `toolCallId`.
It does not parse session JSONL directly and does not use the trace `detail` preview
as authoritative command semantics.

A failed selected-entry read remains an unclassified action. It is never converted
into an empty or workspace-only action.

## Classification coverage

Scope has coverage independent from the normal trace coverage:

- `traceCoverage = available`: every requested trace source used for this scope
  derivation was assessable. A valid empty trace can therefore have zero scope
  observations while still being assessed.
- `traceCoverage = partial`: only some supplied trace sources were assessable.
- `traceCoverage = unavailable`: no supplied trace source could be assessed.

Each observed tool action is also recorded as `classified` or `unclassified`.
Unclassified reasons distinguish missing entry access, missing/malformed tool input,
and tools for which V1 has no classifier. The text report shows classified and
unclassified counts rather than turning unclassified actions into reassuring zeros.

## Built-in classifiers

The initial classifier set is intentionally small and contract-based.

### File/search tools

Known structured contracts classify:

- `read(path)` as filesystem read;
- `write(path)` as filesystem write;
- `grep(path)` / `glob(path)` as filesystem read, with their normal `.` default;
- hashline `edit` / `apply_patch` sections as filesystem write targets.

Relative paths are classified as the current track's `workspace`. For the root
track, absolute paths can be compared with the public trace cwd and the local home
directory to distinguish `workspace`, `host-user`, known system roots, and `unknown`.
The root trace does not expose each child track's cwd, so absolute child paths are
not compared with the root cwd. Symlink targets are not resolved by this layer.

Complex delimiter recovery and arbitrary patch syntaxes are not reimplemented;
unsupported shapes remain unclassified.

### GitHub tool

The OMP GitHub tool has a closed operation schema in the pinned OMP 18.2.0 release.
V1 maps its read operations to `external/read/service`, `pr_create` to
`external/write/service`, and `pr_push` to `external/write/version-control`.
`pr_checkout` records both its external read and its dedicated host-user worktree
write. This follows the documented 18.2.0 tool contract rather than command text.

### Web search

`web_search` is classified as `external/read/service`.

### Generic shell and other tools

Generic `bash`/`eval` command semantics are deliberately **not** parsed in V1, even
when the command text looks obvious (for example `git push`). Unknown tool contracts
also remain unclassified. This is a coverage limitation, not evidence that the
operation stayed inside the workspace.

Additional high-confidence classifiers can be added independently later. They are
fact derivation modules, not assurance policy rules.

## Ordering and footprint

Scope facts retain tool position inside one trace track. The first appearance of a
boundary can therefore be derived deterministically on that track. No causal order
is inferred between parent and child tracks or between concurrent subagents.

A human-facing footprint is the union of the observed boundaries/descriptors. The
report currently shows the boundary union plus action-classification counts; JSON
retains the individual observations and evidence references.

## `omp-kit.scope-expansion`

The default assurance profile enables one rule over these facts:

```text
omp-kit.scope-expansion@1
```

For each trace track independently, its first classified action establishes the
initial observed boundary set. A finding is emitted when a later classified action
first introduces another non-`unknown` boundary on that same track.

Example:

```text
track: main
  1 workspace.read
  2 workspace.write
  3 external.read   <- new-boundary-external
```

The finding means only:

> activity on this track later reached the external boundary for the first time.

It does not mean the action was unauthorized, risky, caused an external write, or
represented semantic "scope drift". If some actions are unclassified or trace
coverage is partial, the rule result is `partial`. If trace evidence is unavailable,
the rule is `skipped` rather than returning zero findings.

## Explicit V1 limitations

Scope V1 records these limitations in the report:

- `declared-targets-only`: a tool contract can describe its declared target without
  proving every transitive effect of the underlying implementation;
- `generic-shell-unclassified`: arbitrary shell/eval semantics are not interpreted;
- `path-symlink-target-unverified`: lexical path classification does not prove the
  final filesystem target after symlink resolution;
- `child-workspace-root-unverified`: the root trace does not provide each child
  track's cwd for absolute-path comparison;
- `cross-track-order-unavailable`: timestamps are not used to invent causal order
  across concurrent tracks.

V1 intentionally does not perform requested-scope inference, authorization checking,
policy-violation detection, severity/risk scoring, LLM command classification, or
cross-subagent causal reconstruction.

## Future composition

Scope is a fact layer rather than a monolithic rule so future assurance rules can
reuse it independently. Candidate consumers include post-failure scope expansion,
external-effect verification, authorization comparison, and a possible future
claim/witness verifier. None of those semantics are implied by Scope V1 itself.
