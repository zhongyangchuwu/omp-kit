---
name: document-parser
description: Parse PDFs, Word, PowerPoint, Excel, images, and web pages into clean Markdown for the agent to read and analyze. Use when the user asks to extract text from a document, convert a PDF, read a paper, parse a scanned file, or any document-to-text task. Backed by MinerU CLI and liteparse.
disable-model-invocation: true
hide: true
---

# Document Parser

Convert documents into Markdown so the agent can read them.

## Boundary

Use when:
- User asks to read, extract, or convert a document (PDF, DOCX, PPTX, XLSX, images).
- Scanned documents, academic papers with tables/formulas, multi-column layouts.

Do not use when:
- The file is already plain text or Markdown — use `read` directly.
- The file is a web page URL — OMP's `read` tool already handles HTML conversion.
- The user wants to edit the document in-place.

## Workflow

### Academic papers, complex layouts, scanned documents → MinerU

MinerU's cloud VLM model produces the best output for multi-column layouts, formulas, and tables.

```bash
mineru-open-api extract <file> -o /tmp/mineru-out/
```

Then `read` the output (e.g. `/tmp/mineru-out/<name>.md`).

### Simple documents, offline, no token → liteparse

liteparse runs locally (Rust + PDFium), free, no API key needed. Good for single-column PDFs, DOCX, PPTX, XLSX when MinerU is unavailable or overkill.

```bash
lit parse <file> -o /tmp/liteparse-out/<name>.txt
```

Then `read` the output.

### Flash extraction (no token, small PDFs)

```bash
mineru-open-api flash-extract <file> -o /tmp/mineru-out/
```

## Reference Routing

| Need | Read |
| --- | --- |
| MinerU install, auth, flags, model selection | [mineru.md](references/mineru.md) |
| liteparse install, CLI flags, OCR options | [liteparse.md](references/liteparse.md) |
| Rare formats or edge cases | Web search latest docs |
