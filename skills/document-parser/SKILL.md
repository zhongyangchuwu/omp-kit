---
name: document-parser
description: Parse PDFs, Word, PowerPoint, Excel, images, and web pages into clean Markdown for the agent to read and analyze. Use when the user asks to extract text from a document, convert a PDF, read a paper, parse a scanned file, or any document-to-text task. Backed by MinerU CLI; falls back to future tools as needed.
---

# Document Parser

Convert documents into Markdown so the agent can read them.

## Boundary

Use when:
- User asks to read, extract, or convert a document (PDF, DOCX, PPTX, XLSX, images).
- User shares a file path or URL to a document.
- Scanned documents, academic papers with tables/formulas, multi-column layouts.

Do not use when:
- The file is already plain text or Markdown — read it directly.
- The user wants to edit the document in-place.

## Workflow

1. **Pick a tool** — default to MinerU CLI (`mineru-open-api`). Read `references/mineru.md` for details.
2. **Parse** — `mineru-open-api extract <file> -o /tmp/mineru-out/`. Output is Markdown + extracted images.
3. **Read** — use the `read` tool on the output file (e.g. `/tmp/mineru-out/<name>.md`).

For flash extraction without a token (small files):
`mineru-open-api flash-extract <file> -o /tmp/mineru-out/`

## Reference Routing

| Need | Read |
| --- | --- |
| Installation, auth, flags, gotchas | [mineru.md](references/mineru.md) |
| Rare languages or edge-case formats | Web search mineru.net latest docs |
