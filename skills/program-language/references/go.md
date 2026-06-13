# Go

## Official entry points

Start here. These are the authoritative entry points for the Go ecosystem.

| Resource | URL |
|----------|-----|
| Go docs (modules, testing, tooling, concurrency) | [go.dev/doc](https://go.dev/doc/) |
| Effective Go (idiomatic design) | [go.dev/doc/effective_go](https://go.dev/doc/effective_go) |
| Go Wiki (Code Review Comments, Modules, Testing, Performance) | [go.dev/wiki](https://go.dev/wiki/) |
| Go Modules reference | [go.dev/ref/mod](https://go.dev/ref/mod) |
| Standard library index | [pkg.go.dev/std](https://pkg.go.dev/std) |

## Project scaffolding

Go Project Layout is a widely referenced community layout — useful as a menu of conventions, not an official standard:

- [github.com/golang-standards/project-layout](https://github.com/golang-standards/project-layout)

Common directories from it:

```
/cmd/        — one subdirectory per binary; each contains a minimal main.go
/internal/   — private application code (enforced by the compiler)
/pkg/        — library code safe for external imports
/api/        — OpenAPI / protobuf specs
/configs/    — config file templates or defaults
```

## Toolchain

These are common Go project tools. Use the smallest set that fits the project's lifetime and maintenance needs:

| Tool | Purpose | URL |
|------|---------|-----|
| `gofmt` | Standard formatter; use it for almost every Go project. | [pkg.go.dev/cmd/gofmt](https://pkg.go.dev/cmd/gofmt) |
| `go vet` | Official static analysis; useful before commits or in CI. | [pkg.go.dev/cmd/vet](https://pkg.go.dev/cmd/vet) |
| `golangci-lint` | Lint aggregator: staticcheck, errcheck, govet, ineffassign, revive, and many others. Good for maintained projects. | [golangci-lint.run](https://golangci-lint.run/) |
| `go test` | Standard testing, benchmarking, coverage. | [go.dev/doc/tutorial/add-a-test](https://go.dev/doc/tutorial/add-a-test) |
| `testify` | Popular assertions and mocking library. Useful when standard `testing` becomes verbose. | [github.com/stretchr/testify](https://github.com/stretchr/testify) |

`golangci-lint` is usually the best lint entry point for maintained Go services and libraries. Start with a small rule set, then tighten it when the team is ready; enabling every linter up front can create noise.

## Core libraries by domain

### HTTP — routers

| Library | Style | URL |
|---------|-------|-----|
| `net/http` | Standard library. Still the foundation. | [pkg.go.dev/net/http](https://pkg.go.dev/net/http) |
| **chi** | Lightweight, idiomatic, composes with `net/http`. Good default for small and medium API servers. | [github.com/go-chi/chi](https://github.com/go-chi/chi) |
| **Gin** | Large ecosystem, high throughput. Good when you want a batteries-included web framework. | [github.com/gin-gonic/gin](https://github.com/gin-gonic/gin) |
| **Echo** | Feature-complete, good middleware story. | [github.com/labstack/echo](https://github.com/labstack/echo) |

Start with `net/http` or chi unless the project benefits from a larger framework ecosystem.

### CLI

| Library | Purpose | URL |
|---------|---------|-----|
| **Cobra** | Common CLI framework. Useful for multi-command CLIs; small tools may only need `flag`. | [github.com/spf13/cobra](https://github.com/spf13/cobra) |

### Configuration

| Library | Purpose | URL |
|---------|---------|-----|
| **Viper** | Reads env vars, flags, config files (YAML/JSON/TOML). Useful when config has multiple sources or formats. Simple tools can use `flag`, `os.LookupEnv`, or a typed config struct directly. | [github.com/spf13/viper](https://github.com/spf13/viper) |

### Logging

| Library | Style | URL |
|---------|-------|-----|
| **Zap** | High-performance structured logging (Uber). | [github.com/uber-go/zap](https://github.com/uber-go/zap) |
| **Zerolog** | Zero-allocation JSON logging. Simpler API than Zap. | [github.com/rs/zerolog](https://github.com/rs/zerolog) |

Zap fits larger services; Zerolog fits smaller services or CLI apps that want simple structured JSON logging. For very small tools, the standard `log`/`slog` package may be enough.

### Database / ORM

| Library | Style | URL |
|---------|-------|-----|
| **sqlc** | Write SQL, get type-safe Go. Compile-time safety, no reflection. Good when the team is comfortable owning SQL. | [sqlc.dev](https://sqlc.dev/) |
| **GORM** | Full ORM. Popular, broad ecosystem. Useful when ORM ergonomics matter more than explicit SQL. | [gorm.io](https://gorm.io/) |
| **ent** | Schema-first entity framework (Meta). Code generation from schema definitions. | [entgo.io](https://entgo.io/) |

Decision hints:
- Prefer explicit SQL and compile-time query checking → sqlc
- Prefer traditional ORM patterns, associations, hooks → GORM
- Prefer schema-first generated entity APIs → ent

## Concurrency primitives

| Resource | Purpose | URL |
|----------|---------|-----|
| `context` | Cancellation, deadlines, request-scoped values. Essential for server requests and goroutines that can outlive their caller. | [pkg.go.dev/context](https://pkg.go.dev/context) |
| `errgroup` | Run goroutines, collect first error. | [pkg.go.dev/golang.org/x/sync/errgroup](https://pkg.go.dev/golang.org/x/sync/errgroup) |
| `semaphore` | Weighted semaphore for worker pools. | [pkg.go.dev/golang.org/x/sync/semaphore](https://pkg.go.dev/golang.org/x/sync/semaphore) |

## API, RPC, and observability

For cross-language API specs, RPC, tracing, metrics, and deployment references, read [shared.md](shared.md).

Go-specific entry points:

| Resource | Purpose | URL |
|----------|---------|-----|
| gRPC Go docs | Go language guide for gRPC. | [grpc.io/docs/languages/go](https://grpc.io/docs/languages/go/) |
| oapi-codegen | Generate Go server/client code from OpenAPI. | [github.com/deepmap/oapi-codegen](https://github.com/deepmap/oapi-codegen) |
| OpenTelemetry Go | Go instrumentation for traces, metrics, and logs. | [opentelemetry.io/docs/languages/go](https://opentelemetry.io/docs/languages/go/) |
| Prometheus Go guide | Expose Go application metrics for Prometheus. | [prometheus.io/docs/guides/go-application](https://prometheus.io/docs/guides/go-application/) |

Consider OpenTelemetry early for services that need production observability; small command-line tools often do not need it.

## Ecosystem summary

```text
Core (official):    net/http, context, testing, go modules
Engineering:        chi/gin, zap/zerolog, viper/cobra, sqlc/gorm, golangci-lint
Shared infra:       OpenAPI, grpc, opentelemetry, prometheus, docker/k8s
```

## Common pitfalls

- **Context**: goroutines that do I/O or can outlive the caller should usually accept a `context.Context`.
- **Errors**: prefer returned errors for expected failures. Reserve `panic` for unrecoverable programmer mistakes.
- **Linting**: `golangci-lint` is valuable for maintained projects, but tiny scripts may not need a full lint stack.
- **Configuration**: Viper is useful for multi-source config; `flag`, `os.LookupEnv`, or a typed config struct can be better for simple programs.
- **Frameworks**: avoid adding a framework for a small CLI; `flag` + `os` is enough for many tools under 500 lines.
