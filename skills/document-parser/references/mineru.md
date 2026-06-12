# MinerU CLI Reference

MinerU is the primary backend for document parsing. It converts documents to Markdown via the MinerU cloud API (mineru.net).

## Installation

```bash
npm install -g mineru-open-api
```

Verify: `mineru-open-api version`

## Authentication

`extract` mode requires a token. Two ways to set it:

```bash
mineru-open-api auth          # Interactive — stores in ~/.mineru/config.yaml
export MINERU_TOKEN="<token>"  # Or pass via environment variable
```

Token from: https://mineru.net/apiManage/token

`flash-extract` mode does NOT need a token.

## Two modes

| | `extract` (default) | `flash-extract` |
|---|---|---|
| Token | Required | No |
| File size | ≤200 MB | ≤10 MB |
| Pages | ≤200 | ≤20 |
| Output | md, json, docx, html, latex | Markdown only |
| Batch | Yes | No |
| Model | vlm (best), pipeline (no hallucination) | Fixed pipeline |

**Default to `extract`**. Use `flash-extract` only for small files without a token.

## Common commands

```bash
# Parse a document (default: vlm model, auto-detect language)
mineru-open-api extract paper.pdf -o /tmp/mineru-out/

# English paper, force formulas + tables
mineru-open-api extract paper.pdf -o /tmp/mineru-out/ --model vlm --language en --formula --table

# Parse specific pages
mineru-open-api extract report.pdf -o /tmp/mineru-out/ --pages 1-5,8-10

# Batch all PDFs in a directory
mineru-open-api extract *.pdf -o /tmp/mineru-out/

# Flash mode (no token, small files)
mineru-open-api flash-extract slides.pptx -o /tmp/mineru-out/
```

## Common flags

| Flag | Default | Use |
|---|---|---|
| `--model` | vlm | `vlm` (complex layouts) or `pipeline` (no hallucination) |
| `--language` | auto | `en`, `ch`. Other languages → web search |
| `--formula` | on | Disable with `--no-formula` |
| `--table` | on | Disable with `--no-table` |
| `--pages` | all | `1-5` or `1,3,7-10` |
| `--format` / `-f` | md | `md`, `json`, `html`, `latex`, `docx` |

## Supported formats (common)

PDF, DOCX, PPTX, XLSX, images (png/jpg/jpeg/jp2/webp/gif/bmp), URLs to remote files.

DOC, PPT, XLS, HTML only in `extract` mode with token. For the full list → web search.

## Output behavior

- With `-o`: result saved to file (`<name>.md`) + extracted images in `images/`.
- Without `-o`: result to stdout, progress to stderr.
- Always use `-o` — the agent reads the file afterward.

## Gotchas

### Token resolution order

`--token` flag → `MINERU_TOKEN` env → `~/.mineru/config.yaml`

### Progress output

Progress lines (e.g. "Parsing 13/14 pages") go to stderr. Do not confuse with errors.

### Large files

27MB PDF with VLM model takes ~10 seconds. Larger files or pipeline model may take longer — the default timeout is 900s, which is sufficient.
