# MinerU CLI Reference

This Skill uses the `mineru-open-api` cloud client. It is not the separately deployable local MinerU engine. Both `extract` and token-free `flash-extract` send documents to a remote service.

## Privacy and authorization

Confirm that service upload is allowed for the actual document. No token does not mean offline or private. Use local liteparse for documents that must remain on the machine. Do not print tokens or place them in command logs; prefer the supported environment/config authentication route.

## Installation and authentication

When installation is authorized:

```bash
npm install -g mineru-open-api
mineru-open-api version
mineru-open-api --help
```

Precision extraction uses a token; use the client's interactive authentication or `MINERU_TOKEN` environment variable. Verify the installed CLI's resolution rules rather than exposing a token in an example command.

```bash
mineru-open-api auth
```

## Modes

`extract` provides authenticated precision/batch extraction; `flash-extract` is token-free with smaller service limits. Supported input formats, page/size limits, model choices and output options vary by mode and release. In particular, do not assume that a format supported by flash has the same precision-mode support.

```bash
mineru-open-api extract paper.pdf -o /tmp/mineru-out/
mineru-open-api flash-extract slides.pptx -o /tmp/mineru-out/
```

Check `extract --help` or `flash-extract --help` before relying on page selection, formula/table flags, language or output-format options. Preserve useful defaults but do not claim that a pipeline model has no hallucinations or that one model is universally best.

## Output and failures

Prefer explicit output paths to keep large extraction results out of the agent's immediate context. Inspect the actual files returned and representative content. Progress on stderr is not by itself an error; use the exit status and service result together.

Use a bounded timeout appropriate to observed job progress. A single historical file's duration is not a promise that every larger file will complete under a fixed timeout. On failure, retain useful diagnostics without copying private documents or tokens into repository evidence.

## Sources

- Official CLI/integrations: https://github.com/opendatalab/MinerU-Ecosystem
- Service documentation: https://mineru.net/apiManage/docs
