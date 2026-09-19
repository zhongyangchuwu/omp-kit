set dotenv-load := false

# Development install: link this working tree through OMP's native local install flow.
# Re-running is safe when dependencies or plugin registration change.
install:
    bun install --frozen-lockfile
    omp install .
    omp plugin list

# Inspect the runtime version and native plugin registration.
check-install:
    omp --version
    omp plugin list

# Doctor checks the whole active plugin root, not only omp-kit.
plugin-doctor:
    omp plugin doctor

uninstall:
    omp plugin uninstall omp-kit

test-ts:
    bun run test:ts

typecheck:
    bun run typecheck

# Provider-free repository acceptance. No cloud resource or OMP model calls.
verify:
    just typecheck
    just test-ts
    git diff --check HEAD
