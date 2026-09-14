# liteparse Reference

liteparse is a local Rust/PDFium document parser. Prefer it when local processing fits the task or privacy excludes a cloud service. Verify installed-version capabilities rather than assuming old output limitations still apply.

## Installation

Use one appropriate installation route, only when dependency installation is authorized:

```bash
uv tool install liteparse
# Alternatives:
# pip install liteparse
# npm i -g @llamaindex/liteparse
# cargo install liteparse
```

Inspect `lit --help` and `lit parse --help` for the installed build.

## Dependencies and offline operation

PDF processing uses PDFium. Office documents use LibreOffice for conversion; it must be available locally. A Skill file alone does not install that dependency.

OCR needs language data. Provision it in advance for an offline/air-gapped environment, using `TESSDATA_PREFIX` or supported tessdata-path configuration. A first-run language-data download is network activity, and an explicitly configured HTTP OCR service is not local-only processing.

## Common commands

```bash
lit parse document.pdf -o /tmp/liteparse-out/output.txt
lit parse document.pdf --target-pages "1-5,10-15" -o /tmp/liteparse-out/output.txt
lit parse document.pdf --no-ocr -o /tmp/liteparse-out/output.txt
lit batch-parse ./input-dir ./output-dir
```

Use the actual output path/result. Preserve source files. Select supported output formats through the installed CLI rather than assuming only plain text exists.

## Output checks and limits

Inspect representative text order, tables, equations and scanned regions. Local extraction can preserve spatial information without proving faithful semantic reconstruction. Newer versions expose additional Markdown/layout/structure data, so the former blanket claims of no headings or tables are not portable limits.

Use OCR only where needed. Do not report complete faithful conversion merely because a command succeeded. Remote MinerU can be considered for a difficult layout only within the document-upload authorization boundary; it is not automatically better for every file.

## Sources

- Official implementation and current CLI: https://github.com/run-llama/liteparse
- Office conversion/offline setup: https://github.com/run-llama/liteparse/blob/main/README.zh-CN.md
