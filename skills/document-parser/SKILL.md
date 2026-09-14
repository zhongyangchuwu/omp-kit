---
name: document-parser
description: Parse PDF, Word, PowerPoint, Excel, image, and scanned-document files into Markdown or text. Use only when the user explicitly asks to read, extract, convert, or parse a document or requests this document-parsing workflow. Do not use for ordinary web page URLs; OMP read already handles HTML. Uses an appropriate local liteparse or authorized MinerU service path.
---

# Document Parser

Convert documents into readable Markdown or text without changing the original.

## Boundary

Use for explicit document extraction requests, including complex academic layouts and scans. Plain text/Markdown uses `read` directly; ordinary web pages use OMP `read`. In-place document editing is outside this Skill.

## Choose the path

Check privacy, format, installed tooling and output needs before choosing a parser. Prefer local extraction when it is adequate or the document must not leave the machine. Do not install dependencies or upload sensitive files merely because this Skill was selected.

### Local/offline extraction: liteparse

```bash
lit parse <file> -o /tmp/liteparse-out/<name>.txt
```

Use the actual returned output. Office formats require the local conversion dependency (LibreOffice); confirm it is available. Offline OCR also needs its language data provisioned. A configured external OCR service is not an offline path.

### Complex layouts: authorized MinerU service

MinerU is a candidate for formulas, tables and multi-column layouts when its supported formats and service behavior fit the request. There is no universal best parser; inspect representative output.

```bash
mineru-open-api extract <file> -o /tmp/mineru-out/
```

This uploads the document. Verify that disclosure to the service is authorized and compatible with the document's privacy constraints before invoking it.

### Flash extraction

```bash
mineru-open-api flash-extract <file> -o /tmp/mineru-out/
```

No API token does **not** mean offline: flash extraction also uses a remote service. Apply the same upload/privacy boundary, and check current size/page/format limits with installed help or official documentation.

## Verify output

Preserve the source, inspect reading order and representative tables/formulas, and distinguish extracted text from OCR uncertainty. Do not report complete faithful conversion from exit status alone.

## Reference Routing

| Need | Read |
| --- | --- |
| MinerU install, auth, flags, model selection | [mineru.md](references/mineru.md) |
| liteparse install, CLI flags, OCR options | [liteparse.md](references/liteparse.md) |
| Rare formats or version-sensitive limits | Verify the installed CLI and official documentation |
