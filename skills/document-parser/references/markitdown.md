# MarkItDown Reference

MarkItDown is a local Python utility for converting files to Markdown. It is a **secondary backend**, used for formats MinerU does not support well — audio, YouTube, EPUB — and as a fallback when the MinerU API is unavailable.

## Installation

```bash
pip install 'markitdown[all]'
# Or for offline/locked environments:
uv tool install 'markitdown[all]'
```

## When to use MarkItDown over MinerU

| Format | Use | Reason |
|---|---|---|
| Audio (.wav, .mp3) | MarkItDown | Speech transcription — MinerU cannot handle |
| YouTube URLs | MarkItDown | Transcript extraction — MinerU cannot handle |
| EPUB | MarkItDown | MinerU does not support EPUB |
| HTML | MarkItDown | Local/lightweight — MinerU only via URL upload |
| CSV, JSON, XML | MarkItDown | Text-based — MinerU overkill |
| ZIP | MarkItDown | Iterates contents — MinerU cannot handle |
| Office docs when offline | MarkItDown | MinerU extract requires network |
| **PDF (academic)** | **MinerU** | Multi-column, formulas, tables — MarkItDown garbles |
| **PDF (simple)** | Either | Single-column, no formulas — both work |

## Common commands

```bash
# Convert a file
markitdown document.docx -o /tmp/md-out/document.md

# YouTube transcript
markitdown "https://www.youtube.com/watch?v=..." -o /tmp/md-out/transcript.md

# Audio transcription
markitdown recording.mp3 -o /tmp/md-out/transcript.md

# EPUB
markitdown book.epub -o /tmp/md-out/book.md
```

## Limitations

- **PDF quality is poor** for multi-column, academic papers — use MinerU instead.
- Python dependency chain is heavy (~48 packages for `[all]`).
- No cloud API — processes locally, so large files may be slow.
- OCR requires the `markitdown-ocr` plugin with an OpenAI-compatible LLM client.

## In the skill workflow

The document-parser skill defaults to MinerU for all PDF, DOCX, PPTX, XLSX, and image formats. If a user needs audio transcription, YouTube extraction, or EPUB conversion, route to MarkItDown instead.
