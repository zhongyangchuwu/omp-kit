---
name: document-parser
description: Parse PDFs, Word, PowerPoint, Excel, images, web pages, audio, YouTube, and EPUB into clean Markdown for the agent to read and analyze. Backed by MinerU CLI for academic documents and MarkItDown for local/niche formats.
---

# Document Parser

Convert documents into Markdown so the agent can read them.

## Boundary

- User asks to read, extract, or convert any document.
- Audio files (.wav, .mp3), YouTube URLs, EPUB — use MarkItDown.
- PDF, DOCX, PPTX, XLSX, images — use MinerU (primary).
- Scanned documents, academic papers with tables/formulas, multi-column layouts — MinerU.

Do not use when:
- The file is already plain text or Markdown — read it directly.
- The user wants to edit the document in-place.

## Workflow

### PDF, Office documents, Images → MinerU (default)

1. **Parse** — `mineru-open-api extract <file> -o /tmp/mineru-out/`
2. **Read** — use the `read` tool on the output (e.g. `/tmp/mineru-out/<name>.md`).

### Audio, YouTube, EPUB, HTML, CSV/JSON/XML, ZIP → MarkItDown

1. **Parse** — `markitdown <file_or_url> -o /tmp/md-out/<name>.md`
2. **Read** — use the `read` tool on the output.

For flash extraction without a token (small files):
`mineru-open-api flash-extract <file> -o /tmp/mineru-out/`

## Reference Routing

| Need | Read |
| --- | --- |
| MinerU install, auth, flags, gotchas | [mineru.md](references/mineru.md) |
| Audio, YouTube, EPUB, offline docs | [markitdown.md](references/markitdown.md) |
| Rare languages or edge-case formats | Web search mineru.net latest docs |
