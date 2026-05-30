---
name: doc-coauthoring
description: Guide collaborative drafting of substantial documents such as technical specs, decision records, proposals, RFCs, and project writeups. Use when the user wants structured help gathering context, drafting sections, refining content, and testing whether a document works for future readers.
---

# Doc Co-Authoring Workflow

Use this skill to guide a user through collaborative document creation. Act as an active writing partner through three stages: context gathering, section-by-section drafting, and reader testing.

## When to Use

Use this workflow when the user wants help with substantial written artifacts:

- technical specs;
- decision docs;
- proposals;
- RFCs;
- project writeups;
- structured documentation that other people will read later.

Do not force this workflow for short edits, casual notes, or tasks where the user clearly wants a quick one-shot draft.

## Initial Offer

Offer the structured workflow briefly:

1. **Context Gathering** — collect audience, purpose, constraints, source material, and unresolved questions.
2. **Drafting and Refinement** — build the document section by section.
3. **Reader Testing** — check whether the document works for a fresh reader with less context.

Ask whether the user wants this workflow or prefers freeform drafting. If they decline, help freeform.

## Stage 1: Context Gathering

Start by asking for meta-context:

1. What type of document is this?
2. Who is the primary audience?
3. What should change after someone reads it?
4. Is there a template, required format, or existing document to follow?
5. What constraints, deadlines, politics, or background matter?

Encourage the user to dump context in whatever form is easiest. They can paste notes, point to files, reference prior discussion, or answer in shorthand.

When the user references files, URLs, issues, PRs, or internal resources, use the available Oh My Pi tools to inspect them. Prefer dedicated tools such as `read`, `search`, `github`, browser tooling, or configured MCP integrations over ad hoc shell commands.

After the initial dump, ask targeted clarifying questions until you can reason about edge cases and trade-offs without needing basics explained.

## Stage 2: Drafting and Refinement

Agree on a section outline before drafting. If the user does not know the structure, propose 3-5 sections appropriate to the document type.

Create or update the working document using the safest available mechanism:

- use `write` when creating a new local Markdown file;
- use `edit` for surgical updates to an existing local file;
- if the user is working outside the filesystem, provide section drafts in chat and ask where they should be applied.

For each section:

1. Ask focused questions about what belongs in that section.
2. Brainstorm concrete points that could be included.
3. Ask the user what to keep, remove, combine, or emphasize.
4. Draft the section.
5. Iterate with targeted edits rather than rewriting the whole document.

When drafting the first section, ask the user to give feedback as change requests instead of silently editing around you. That lets you learn their style and priorities for later sections.

Keep checking for:

- redundancy;
- unsupported claims;
- missing context;
- contradictions;
- generic filler;
- audience mismatch;
- sections that do not advance the document's purpose.

## Stage 3: Reader Testing

Reader testing verifies that the document works for someone without the conversation context.

If subagents are available, use `task` to ask a fresh agent to read only the document and answer realistic reader questions. Keep each reader-test task narrow: the document, the target audience, and the specific questions.

If subagents are not appropriate, perform the reader test inline by temporarily adopting the target reader's perspective.

Test:

1. What questions would the intended audience ask after reading this?
2. What is ambiguous or underspecified?
3. What assumptions does the document make?
4. Are there contradictions or unsupported leaps?
5. Can the reader identify the decision, request, or next action?

Report findings, then loop back to refinement for any weak sections.

## Completion Criteria

The document is ready when:

- the user agrees the core content is complete;
- the structure matches the audience and purpose;
- reader testing does not reveal major gaps;
- factual claims that matter have been verified or marked for owner verification;
- the user understands they own final accuracy and distribution.

Before finishing, recommend a final human read-through for facts, links, names, dates, and policy-sensitive claims.

## Local Notes

This is a localized version of the Anthropic `doc-coauthoring` example skill. Claude-specific artifact, connector, and subagent wording has been adapted to Oh My Pi tools and generic agent workflows.
