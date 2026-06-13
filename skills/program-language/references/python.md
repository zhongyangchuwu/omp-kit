# Python

Modern Python engineering reference, organized around the uv workflow. This is a shortlist of common tools and documentation entry points, not a required stack.

## Official entry points

| Resource | Purpose | URL |
|----------|---------|-----|
| Python docs | Language, standard library, `asyncio`, `typing`, `dataclasses`, `venv`, packaging basics. | [docs.python.org/3](https://docs.python.org/3/) |
| Python Packaging User Guide / PyPA | Dependency and packaging guidance: wheels, sdists, dependency spec, PEP 517/518. | [packaging.python.org](https://packaging.python.org/) |
| PEP index | Language and packaging evolution. Useful for PEP 8, 484, 517/518, 621. | [peps.python.org](https://peps.python.org/) |
| `typing` docs | Runtime and static typing primitives. | [docs.python.org/3/library/typing.html](https://docs.python.org/3/library/typing.html) |

## Project and packaging workflow

| Tool | Purpose | URL |
|------|---------|-----|
| **uv** | Fast package, environment, and lockfile workflow. Good default for modern Python projects. | [docs.astral.sh/uv](https://docs.astral.sh/uv/) / [github.com/astral-sh/uv](https://github.com/astral-sh/uv) |
| **pip** | Baseline Python installer. Still important for compatibility and deployment environments. | [pip.pypa.io](https://pip.pypa.io/en/stable/) |
| **venv** | Standard-library virtual environments. Useful when avoiding extra tooling. | [docs.python.org/3/library/venv.html](https://docs.python.org/3/library/venv.html) |
| **Hatch** | Modern Python project/build environment manager. | [hatch.pypa.io](https://hatch.pypa.io/latest/) |
| **Poetry** | Widely used dependency and packaging workflow. Common in existing projects. | [python-poetry.org/docs](https://python-poetry.org/docs/) |

Typical uv commands:

```bash
uv init
uv add requests
uv run python app.py
uv sync
```

For new projects, prefer `pyproject.toml` and consider uv first. Keep `pip`/`venv` knowledge for simple scripts, constrained environments, and compatibility with existing deployment systems.

## Project layout

| Resource | Purpose | URL |
|----------|---------|-----|
| Packaging tutorial | Official packaging walkthrough. | [packaging.python.org/tutorials/packaging-projects](https://packaging.python.org/en/latest/tutorials/packaging-projects/) |
| src layout discussion | Tradeoffs between `src/` layout and flat layout. | [packaging.python.org/src-layout-vs-flat-layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/) |

Common maintained-project shape:

```text
project/
  pyproject.toml
  src/
    package_name/
  tests/
```

Use `src/` layout for reusable packages and maintained applications. Flat layout is fine for small scripts and simple internal tools.

## Code quality and typing

| Tool | Purpose | URL |
|------|---------|-----|
| **Ruff** | Fast linting and formatting; often replaces flake8/isort/pycodestyle. | [docs.astral.sh/ruff](https://docs.astral.sh/ruff/) |
| **Black** | Established formatter; still common in existing projects. | [black.readthedocs.io](https://black.readthedocs.io/) |
| **mypy** | Classic static type checker. | [mypy.readthedocs.io](https://mypy.readthedocs.io/) |
| **pyright** | Fast type checker from Microsoft; strong editor integration. | [microsoft.github.io/pyright](https://microsoft.github.io/pyright/) |

For new projects, `ruff` + `pyright` is a compact modern baseline. Existing projects may still use Black, mypy, flake8, or isort; do not migrate without a reason.

## Testing

| Tool | Purpose | URL |
|------|---------|-----|
| **pytest** | Dominant test framework; fixtures and plugins are the main value. | [docs.pytest.org](https://docs.pytest.org/) |
| **coverage.py** | Coverage measurement. | [coverage.readthedocs.io](https://coverage.readthedocs.io/) |

Use pytest for maintained projects and libraries. Standard-library `unittest` is acceptable when a project already uses it or wants zero dependencies.

## Web and API development

| Tool | Purpose | URL |
|------|---------|-----|
| **FastAPI** | Type-hint-driven API framework with async support and automatic OpenAPI. | [fastapi.tiangolo.com](https://fastapi.tiangolo.com/) |
| **Starlette** | ASGI toolkit underneath FastAPI; useful for lower-level async web work. | [starlette.io](https://www.starlette.io/) |
| **Django** | Mature batteries-included web framework. | [docs.djangoproject.com](https://docs.djangoproject.com/) |
| **Flask** | Lightweight WSGI web framework. | [flask.palletsprojects.com](https://flask.palletsprojects.com/) |
| **Pydantic v2** | Data validation and settings models; central in FastAPI-style stacks. | [docs.pydantic.dev](https://docs.pydantic.dev/) |

Choose FastAPI for typed API services, Django for full web applications/admin/data model integration, Flask for small WSGI services or existing Flask ecosystems.

## Async and concurrency

| Tool | Purpose | URL |
|------|---------|-----|
| `asyncio` | Standard-library async runtime. | [docs.python.org/3/library/asyncio.html](https://docs.python.org/3/library/asyncio.html) |
| **anyio** | Async abstraction over asyncio/trio; used by Starlette/FastAPI ecosystem. | [anyio.readthedocs.io](https://anyio.readthedocs.io/) |

Use async when the workload is I/O-bound and the surrounding stack is async. Do not turn CPU-bound code async for style consistency.

## Data and databases

| Tool | Purpose | URL |
|------|---------|-----|
| **SQLAlchemy 2.0** | ORM and SQL toolkit; current standard for Python database work. | [docs.sqlalchemy.org](https://docs.sqlalchemy.org/) |
| **Alembic** | Database migrations for SQLAlchemy stacks. | [alembic.sqlalchemy.org](https://alembic.sqlalchemy.org/) |
| **asyncpg** | High-performance PostgreSQL async driver. | [magicstack.github.io/asyncpg](https://magicstack.github.io/asyncpg/current/) |
| **Polars** | Modern high-performance DataFrame library. | [pola.rs](https://pola.rs/) |

SQLAlchemy fits general app development. asyncpg fits lower-level async PostgreSQL paths. Polars is a strong default for new performance-sensitive dataframe work; pandas remains common in existing data ecosystems.

## Observability and logging

| Tool | Purpose | URL |
|------|---------|-----|
| **OpenTelemetry Python** | Python instrumentation for traces, metrics, and logs. | [opentelemetry.io/docs/languages/python](https://opentelemetry.io/docs/languages/python/) |
| **structlog** | Structured logging for Python applications. | [structlog.org](https://www.structlog.org/) |
| **Prometheus Python client** | Prometheus metrics client. | [github.com/prometheus/client_python](https://github.com/prometheus/client_python) |

For cross-language observability concepts, also read [shared.md](shared.md).

## CLI and TUI

| Tool | Purpose | URL |
|------|---------|-----|
| **Typer** | Type-hint-driven CLI framework. Good default for multi-command tools. | [typer.tiangolo.com](https://typer.tiangolo.com/) |
| **Click** | Mature CLI framework; Typer builds on it. | [click.palletsprojects.com](https://click.palletsprojects.com/) |
| `argparse` | Standard-library CLI parser. Good for small zero-dependency tools. | [docs.python.org/3/library/argparse.html](https://docs.python.org/3/library/argparse.html) |
| **Rich** | Colored output, tables, progress bars, Markdown, improved tracebacks. | [rich.readthedocs.io](https://rich.readthedocs.io/) |
| **Textual** | Modern TUI framework for terminal applications. | [textual.textualize.io](https://textual.textualize.io/) |
| **prompt_toolkit** | Low-level interactive prompts, REPLs, and shells. | [python-prompt-toolkit.readthedocs.io](https://python-prompt-toolkit.readthedocs.io/) |
| **InquirerPy** | Interactive CLI prompts: select, checkbox, wizard flows. | [github.com/kazhala/InquirerPy](https://github.com/kazhala/InquirerPy) |

Decision hints:

- Small command with a few flags → `argparse`
- Multi-command CLI → Typer + Rich
- Existing Click ecosystem → Click
- Dashboard/admin terminal UI → Textual
- Prompt wizard → InquirerPy
- Custom shell/REPL → prompt_toolkit

## Ecosystem summary

```text
Core:      Python 3.11+, pyproject.toml, uv
Quality:   ruff, pyright/mypy, pytest, coverage.py
Web/API:   FastAPI, Pydantic v2, Starlette, Django, Flask
Data:      SQLAlchemy 2.0, Alembic, asyncpg, Polars
CLI/TUI:   Typer, Rich, Textual, InquirerPy, prompt_toolkit
Ops:       OpenTelemetry, structlog, Prometheus client
```

Compressed AI stack hint:

> Python modern engineering = uv + ruff + pyright + pytest; add FastAPI + Pydantic v2 + SQLAlchemy 2.0 for typed API services; add Typer + Rich for CLI tools; add Textual for TUI apps.

## Common pitfalls

- **Tool pile-up**: uv + ruff can replace several older tools in new projects; avoid adding pip-tools/poetry/flake8/isort unless the project needs them or already uses them.
- **Async by default**: async helps I/O-bound services, not CPU-bound work.
- **Framework mismatch**: FastAPI is not a replacement for Django admin/auth/ORM-heavy apps.
- **Type checker noise**: start with useful strictness, then tighten. A noisy type config gets ignored.
- **DataFrame migration**: Polars is strong for new data pipelines; pandas compatibility still matters in many data science ecosystems.
