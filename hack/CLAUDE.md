# KKP Dashboard — CI/CD & Developer Tooling

## Key Utilities in lib.sh

Source with `. hack/lib.sh` to get:

- `echodate` — Timestamped logging
- `retry N command` — Exponential backoff retry
- `appendTrap command SIGNAL` — Append to existing traps
- `containerize command` — Run command inside Docker container
- `write_junit` — Generate JUnit XML test reports

## Boilerplate

License headers live in `boilerplate/ce/` and `boilerplate/ee/` — one template per file type (`.go`, `.ts`, `.html`, `.scss`, `.yaml`, `.sh`, `.Dockerfile`). `verify-boilerplate.sh` checks all files match.
