# liteparse Reference

liteparse is a fast local document parser (Rust + PDFium). It is the **offline backend** — use it when MinerU is unavailable, the document is simple, or privacy requires local processing.

## Installation

```bash
# Python (recommended)
pip install liteparse
# Or: uv tool install liteparse

# Node.js
npm i -g @llamaindex/liteparse

# Rust
cargo install liteparse
```

All methods install the same `lit` CLI. No API key, no registration.

## When to use liteparse over MinerU

| Use liteparse | Use MinerU |
|---|---|
| Offline / air-gapped | Cloud OK, need best quality |
| Simple single-column PDFs | Multi-column academic papers |
| No token / API key | Formulas, tables matter |
| DOCX, PPTX, XLSX (fast local) | Scanned documents with complex layouts |
| Privacy-sensitive documents | Figure/chart extraction needed |

## Common commands

```bash
# Basic parsing (outputs layout-preserved plain text)
lit parse document.pdf -o /tmp/liteparse-out/output.txt

# Parse specific pages
lit parse document.pdf --target-pages "1-5,10-15" -o /tmp/liteparse-out/output.txt

# Disable OCR (faster, for digital PDFs only)
lit parse document.pdf --no-ocr -o /tmp/liteparse-out/output.txt

# Batch parse a directory
lit batch-parse ./input-dir ./output-dir
```

## How it works

1. **PDFium** (same C library Chrome uses) extracts text with precise x,y coordinates from each page.
2. Optional **Tesseract OCR** for scanned pages (no text layer).
3. **Grid Projection** reconstructs spatial layout — separates columns, preserves reading order.
4. Output: layout-preserved plain text with `--- Page N ---` markers.

## Limitations

- **No formula rendering** — LaTeX equations output as raw text.
- **No heading hierarchy** — flat text, no `#`/`##` marks (use MinerU for structure).
- **No image extraction** — use `lit screenshot` for page images if needed.
- **No table extraction** — tables appear as spatial text, not structured.
- OCR requires Tesseract (bundled; first run downloads language data ~36MB).

## Output behavior

- `-o <path>`: saves to file. Without it, prints to stdout.
- Output format is plain text with page markers and layout preservation.
- Tesseract OCR triggers automatically when a page has no extractable text layer.
