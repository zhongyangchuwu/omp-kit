# Shared Ecosystem References

Cross-language standards and infrastructure tools. Use this as a reference map, not a required stack.

## API specifications and RPC

| Resource | Purpose | URL |
|----------|---------|-----|
| **OpenAPI** | REST API description standard; useful for docs, validation, and client/server generation. | [swagger.io/specification](https://swagger.io/specification/) |
| **Protobuf** | Schema language for binary serialization and gRPC contracts. | [protobuf.dev](https://protobuf.dev/) |
| **gRPC** | HTTP/2 RPC framework with first-class code generation across languages. | [grpc.io/docs](https://grpc.io/docs/) |

Use OpenAPI for public or partner-facing REST APIs. Use gRPC/Protobuf when typed service contracts, streaming, or multi-language RPC are central to the project.

## Observability

| Resource | Purpose | URL |
|----------|---------|-----|
| **OpenTelemetry** | Vendor-neutral traces, metrics, and logs instrumentation. | [opentelemetry.io/docs](https://opentelemetry.io/docs/) |
| **Prometheus** | Metrics model, scraping, and alerting ecosystem. | [prometheus.io/docs](https://prometheus.io/docs/) |
| **Jaeger** | Distributed tracing backend. | [jaegertracing.io/docs](https://www.jaegertracing.io/docs/) |

Consider these early for production services. Small local tools and scripts usually do not need full observability plumbing.

## Project command runner

| Resource | Purpose | URL |
|----------|---------|-----|
| **just** | Project-local command runner for common recipes such as test, lint, format, build, and dev tasks. | [just.systems/man/en](https://just.systems/man/en/) / [github.com/casey/just](https://github.com/casey/just) |

Use `just` when a project has recurring commands that should be discoverable and consistent across machines. It is a command runner, not a build system; keep recipes thin wrappers around language-native tools.

## Runtime and deployment context

| Resource | Purpose | URL |
|----------|---------|-----|
| **Docker** | Container packaging and local service composition. | [docs.docker.com](https://docs.docker.com/) |
| **Kubernetes** | Container orchestration for service deployments. | [kubernetes.io/docs](https://kubernetes.io/docs/) |

Do not add Docker or Kubernetes complexity just to match the ecosystem. Use them when deployment, local integration tests, or operations need them.
