# Validation

Use this when it is unclear whether a product direction is worth building, which assumption is load-bearing, or what signal should prove the first slice works.

Validation should reduce product risk without becoming a research project by default.

## Assumption types

- **Desirability:** users want this enough to change behavior.
- **Usability:** users can understand and complete the flow.
- **Viability:** the feature supports the business or operational model.
- **Feasibility:** the team can build and operate it within constraints.
- **Quality:** generated, imported, or transformed output is good enough for the job.
- **Trust / safety:** users will grant access, accept risk, or rely on the result.

## Choose the riskiest assumption

Ask: if this assumption is false, would the feature still be worth building?

Pick one primary assumption unless the feature is high-stakes or irreversible.

## Smallest useful validation

Prefer the cheapest signal that can change the decision:

- story interview for problem clarity;
- fake-door or waitlist for demand;
- concierge/manual workflow for value and output shape;
- clickable sketch or first-click test for flow comprehension;
- prototype on a narrow data set for output quality;
- technical spike only when feasibility is the riskiest product assumption;
- beta with explicit success/kill criteria for adoption.

## Output

```markdown
## Riskiest assumption
<Assumption and why it is load-bearing.>

## Validation method
<Smallest signal that can change the decision.>

## Success signal
<Observable behavior, metric, or qualitative threshold.>

## Failure signal
<What would convince us to change, narrow, or stop.>

## Next decision
<What we will do if the signal passes, fails, or is mixed.>
```

## Rules

- Do not invent market evidence or user research.
- Mark inferred users, pains, and willingness-to-pay as assumptions.
- Do not require validation theater for small reversible improvements with clear user value.
- High-stakes, irreversible, public, destructive, or trust-heavy features need stronger validation before broad release.
