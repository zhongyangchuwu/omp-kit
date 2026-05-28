# Evaluation Guide

Use evals for important skills, fragile workflows, discipline-enforcing instructions, and any skill that will be reused across projects.

## Eval structure

Store cases under the skill directory:

```text
skill-name/
  evals/
    evals.json
    files/
```

Each case should include:

- realistic prompt;
- expected output;
- optional input files;
- assertions that can be checked from the output.

Use [evals-template.json](../assets/evals-template.json) when starting.

## Baselines

Compare against a baseline:

- no skill, for a new skill;
- previous version, for an update;
- alternative design, for a refactor.

Keep each run isolated. The output should reflect what the skill says, not what the current conversation already knows.

## Assertions

Good assertions are concrete and observable:

- "The generated skill has `name` and `description` frontmatter."
- "Runtime-specific fields are absent from the portable template."
- "The review identifies at least one safety risk in a script that reads secrets."

Weak assertions are vague:

- "The answer is good."
- "The skill is professional."
- "The agent follows best practices."

## Grading

Record pass/fail with evidence:

```json
{
  "assertion_results": [
    {
      "text": "The generated skill has required frontmatter.",
      "passed": true,
      "evidence": "Output begins with name and description fields."
    }
  ],
  "summary": {"passed": 1, "failed": 0, "total": 1}
}
```

Use scripts for mechanical checks when possible. Use human review for judgment that cannot be reduced to assertions.

## Iteration loop

1. Write or update evals before changing a skill when the behavior is testable.
2. Run baseline and candidate.
3. Grade assertions and review outputs.
4. Read execution traces to find wasted steps or ignored instructions.
5. Update the skill to fix general causes, not one prompt.
6. Re-run the evals.
7. Update maintenance notes.

## Minimum eval set

For a small but important skill, start with:

- one happy path;
- one ambiguous prompt;
- one near miss that should not trigger or should be declined;
- one update or maintenance scenario if the skill will evolve over time.
