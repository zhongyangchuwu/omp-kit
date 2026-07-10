# Rust

Modern Rust engineering reference. Favor Cargo, the stable toolchain, and the standard quality components before adding ecosystem tooling.

## Official entry points

| Resource | Purpose | URL |
| --- | --- | --- |
| The Rust Programming Language | Language fundamentals, ownership, error handling, concurrency, testing, and cargo workflow. | [doc.rust-lang.org/book](https://doc.rust-lang.org/book/) |
| Rust Reference | Precise language semantics. | [doc.rust-lang.org/reference](https://doc.rust-lang.org/reference/) |
| Cargo Book | Packages, manifests, dependency resolution, workspaces, configuration, tests, and publishing. | [doc.rust-lang.org/cargo](https://doc.rust-lang.org/cargo/) |
| Rust Standard Library | Standard library APIs and traits. | [doc.rust-lang.org/std](https://doc.rust-lang.org/std/) |
| Rust API Guidelines | Public-library API design conventions. | [rust-lang.github.io/api-guidelines](https://rust-lang.github.io/api-guidelines/) |
| rustup book | Toolchain, component, and target management. | [rust-lang.github.io/rustup](https://rust-lang.github.io/rustup/) |

## Toolchain and project workflow

Use `rustup` to install and select the stable toolchain. The standard components are Cargo, `rustc`, `rustfmt`, and Clippy; install missing quality and editor components explicitly:

```bash
rustup toolchain install stable
rustup component add rustfmt clippy rust-analyzer
cargo new --bin my-app
# or: cargo new --lib my-library
```

Use a project-local `rust-toolchain.toml` when the repository needs a pinned channel, components, or target platforms. Declare `rust-version` in `Cargo.toml` when the project has a minimum supported Rust version (MSRV), then test that version in CI.

| Command | Purpose |
| --- | --- |
| `cargo new --bin <name>` | Create an application package. |
| `cargo new --lib <name>` | Create a library package. |
| `cargo add <crate>` | Add a dependency through Cargo. |
| `cargo check` | Type-check and analyze quickly without producing a final binary. |
| `cargo build` | Compile the current package. |
| `cargo run` | Build and run a binary package. |
| `cargo test` | Run unit tests, integration tests, and doctests. |
| `cargo doc --no-deps` | Build local API documentation without dependency docs. |
| `cargo tree` | Inspect resolved dependency paths. |

For maintained repositories, make these the narrow, reproducible quality commands:

```bash
cargo fmt --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-targets --all-features
cargo doc --workspace --no-deps
```

Use the `--workspace` and `--all-features` variants only when the repository's supported feature combinations make them meaningful. A library with mutually exclusive features needs an explicit feature-test matrix instead of assuming one all-features run proves every combination.

`Cargo.lock` records a resolved dependency graph. Commit it for applications, binaries, and reproducible workspaces. Libraries published for downstream use usually leave it untracked unless the project has a deliberate reproducibility policy that says otherwise.

## Project layout

Cargo defines the important conventions; do not introduce a generic multi-language layout over them.

```text
project/
  Cargo.toml               # package, dependencies, features, profiles
  Cargo.lock               # committed for applications/workspaces
  rust-toolchain.toml      # optional pinned channel/components/targets
  src/
    main.rs                # default binary entry point
    lib.rs                 # library root
    bin/                   # additional binaries
  tests/                   # integration tests through the public API
  examples/                # runnable examples
  benches/                 # benchmarks
  build.rs                 # only when build-time generation/configuration is required
```

Keep unit tests next to the module they test under `#[cfg(test)]`; use `tests/` for integration tests that exercise public behavior. `cargo test` runs doctests by default, so documentation examples must compile and remain accurate.

Use a workspace when multiple packages share a lockfile, targets, CI policy, or release lifecycle. Keep the root manifest focused on members and shared workspace configuration; avoid forcing unrelated crates into one workspace merely because they are in one repository.

## Quality, editor, and CI baseline

| Tool | Purpose | Guidance |
| --- | --- | --- |
| `rustfmt` / `cargo fmt` | Standard formatter. | Run `cargo fmt`; enforce `cargo fmt --check` in CI. |
| Clippy / `cargo clippy` | Rust-aware lints. | Start with project-relevant warnings; CI may deny warnings after the baseline is clean. |
| `cargo check` | Fast compiler analysis. | Use during edit loops; it is not a replacement for tests. |
| `cargo test` | Unit, integration, and doctest runner. | Prefer behavior-focused unit/integration coverage; add benchmarks separately. |
| `rust-analyzer` | Language server for navigation, refactoring, formatting, and diagnostics. | Install with `rustup component add rust-analyzer`; install `rust-src` if the editor cannot navigate the standard library. |
| `cargo doc` | Local API documentation. | Run with `--no-deps` in normal CI; use doc warnings as a quality signal for public crates. |

A small application normally needs only Cargo, rustfmt, Clippy, and built-in tests. Add a task runner such as `just` only when the repository has cross-tool or repeated operational commands; keep recipes thin wrappers over Cargo commands.

## Common libraries by domain

Use the standard library until a real boundary needs more. These are mainstream defaults, not a required stack.

| Domain | Default | Use when |
| --- | --- | --- |
| Serialization | `serde` plus a format crate such as `serde_json` | Crossing JSON, TOML, or other data-format boundaries. |
| Errors | `thiserror` for typed library/domain errors; `anyhow` at application boundaries | The error contract needs derives or CLI/service code needs contextual propagation. |
| Async runtime | `tokio` | The workload is I/O-bound and needs async networking, process, timer, or synchronization facilities. |
| HTTP service | `axum` | Building a Tokio-based HTTP API; do not add it for a local CLI. |
| CLI | `clap` | A multi-command or typed command-line interface needs parsing, help, and completions. |
| Observability | `tracing` with `tracing-subscriber` | Structured diagnostics, spans, or asynchronous service telemetry matter. |
| Database | `sqlx` | The application needs asynchronous database access and is prepared to own SQL and migrations. |
| Property testing | `proptest` | Invariants and wide input spaces are more valuable than a few examples. |

For public libraries, make error types, feature flags, and semver promises deliberate. Avoid default features that unexpectedly pull in heavy runtimes or system dependencies.

## Concurrency and safety

- Prefer ownership and message passing to shared mutable state. Use `Arc<Mutex<_>>` only when shared mutable state is truly the smallest model.
- Do not hold blocking locks or expensive CPU work across `.await` points.
- Use async for I/O-bound concurrency, not as a default for CPU-bound code or small command-line tools.
- Keep `unsafe` small, documented with its safety invariant, and covered by focused tests. Prefer safe abstractions when they do not hide material cost or behavior.
- Treat `unwrap` and `expect` as acceptable in tests and proven startup invariants; return or add context to errors on ordinary runtime paths.

## Common pitfalls

- **Toolchain drift:** use `rust-toolchain.toml` and `rust-version` when reproducibility or MSRV matters; do not assume every contributor has the same default toolchain.
- **Cargo features:** additive features can create combinations that need deliberate testing. Keep defaults narrow and document incompatible combinations.
- **Lockfile policy:** application lockfiles protect reproducibility; library lockfile policy is different. Do not delete or add one without knowing the package role.
- **Compile versus test:** `cargo check` is fast feedback, but it does not run unit tests, integration tests, or doctests.
- **Async contagion:** introducing an async runtime changes APIs, tests, shutdown behavior, and dependency weight. Use it only when I/O concurrency justifies it.
- **Dependency bloat:** inspect feature defaults and transitive dependencies with `cargo tree`; prefer a narrow feature set over convenience defaults when binary size, build time, or platform support matters.
- **Build scripts:** `build.rs` executes during builds. Keep it deterministic, minimize external assumptions, and document generated inputs and outputs.

## Ecosystem summary

```text
Core:       rustup, stable Rust, Cargo, rustfmt, Clippy, rust-analyzer
Quality:    cargo check, cargo test, cargo doc, explicit MSRV/feature matrix
Common:     serde, thiserror/anyhow, tokio, axum, clap, tracing, sqlx
Project:    Cargo.toml, Cargo.lock policy, rust-toolchain.toml, workspaces
```

For cross-language API specifications, observability, deployment references, and `just`, read [shared.md](shared.md).
