# KKP Dashboard — CI/CD & Developer Tooling

## Key Utilities in lib.sh

Source `. hack/lib.sh`:

- `echodate` — timestamped logging
- `retry N command` — exponential backoff retry
- `appendTrap command SIGNAL` — append to existing traps
- `containerize command` — run in Docker container
- `write_junit` — generate JUnit XML test reports

## Boilerplate

License headers in `boilerplate/ce/`, `boilerplate/ee/` — one template per file type (`.go`, `.ts`, `.html`, `.scss`, `.yaml`, `.sh`, `.Dockerfile`). `verify-boilerplate.sh` checks all files match.

## Verification Scripts

- `verify-boilerplate.sh` — check license headers
- `verify-spelling.sh` — spell check

## CI Scripts (`ci/`)

- `verify.sh` — full CI verification pipeline
- `run-api-e2e.sh` — API E2E tests
- `setup-kind-cluster.sh` — create local Kind cluster for testing
- `setup-kubermatic-in-kind.sh` — install KKP in Kind cluster
- `download-gocache.sh` / `upload-gocache.sh` — Go build cache management