# Brainstorm

Use this when the user wants feature direction, alternative approaches, or a better product shape before implementation.

Brainstorming in this skill is not open-ended creativity for its own sake. It must converge on a useful feature direction that can become a brief, PRD section, or implementation plan.

## Flow

1. Restate the request as a concrete How Might We question.
2. Identify the user, job, and success signal; ask one decision question if any are missing and material.
3. Generate 3-5 materially different approaches.
4. Compare approaches by user value, habit fit, feasibility, differentiation, and risk.
5. Recommend one direction and name the tradeoff.
6. Write a Not Doing list to preserve focus.
7. Surface the assumptions that need validation before or during implementation.

## Approach quality

A useful approach should:

- solve a real user job end to end;
- fit an existing user habit, platform convention, or project pattern unless there is a reason to diverge;
- preserve core value even if the first version is narrow;
- make the main tradeoff explicit;
- avoid adding concepts users do not need to understand.

## Anti-patterns

- Listing many shallow ideas without recommending one.
- Choosing the easiest implementation when it fails the user job.
- Treating a UI shell, placeholder, or configuration surface as an MVP.
- Using generic product adjectives such as seamless, intuitive, powerful, or simple without defining observable behavior.
- Skipping the Not Doing list.

## Output

```markdown
## How Might We
...

## Options
1. **...** — user value, tradeoff, risk
2. **...** — user value, tradeoff, risk
3. **...** — user value, tradeoff, risk

## Recommendation
...

## Not Doing
- ... — reason

## Assumptions to validate
- ... — validation signal
```
