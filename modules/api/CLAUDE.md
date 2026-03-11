# KKP Dashboard — Go REST API

Go REST API server sitting between the Angular UI and Kubernetes clusters. gorilla/mux routing, Go-Kit endpoint abstraction, controller-runtime for K8s API access. Auth via OIDC + Service Account JWT tokens.

## Common Commands

```bash
make build                       # Build binary (EE default, set KUBERMATIC_EDITION=ce for CE)
make lint                        # golangci-lint
make api-test                    # Run tests
make update-codegen              # Regenerate after type/API changes
```

## Architecture

```
HTTP Request → Middleware (auth, RBAC, context) → Handler → Provider → Kubernetes API → Response
```

- **Handlers** (`pkg/handler/`): Parse HTTP, delegate to providers, encode responses. Go-Kit endpoint pattern. v2 is current, v1 is legacy.
- **Providers** (`pkg/provider/`): Business logic interfaces. Implementations in `pkg/provider/kubernetes/` use impersonation clients for RBAC.
- **Middleware** (`pkg/handler/middleware/`): Token verification (OIDC/JWT), user context injection, RBAC checks.
- **Seed-scoped providers**: Per-seed providers (cluster, addon, alertmanager) accessed via getter functions like `ClusterProviderGetter`.

## Key Directories

- `cmd/kubermatic-api/` — Entry point, CE/EE wrapper functions
- `pkg/handler/v2/` — Current API endpoint handlers (~42 resource types)
- `pkg/provider/` — Business logic interfaces + `kubernetes/` implementations
- `pkg/api/v2/` — Request/response models (v1 is legacy)
- `pkg/ee/` — Enterprise Edition features (has own CLAUDE.md)
- `pkg/test/` — Test utilities and mock providers

## CE/EE Build Tags

```go
//go:build ee    // EE-only code
//go:build !ee   // CE-only code (stubs)
```

- CE stubs in `cmd/kubermatic-api/wrappers_ce.go` return `nil` for EE providers. 
- EE implementations in `pkg/ee/`. See `pkg/ee/CLAUDE.md` for the full EE feature pattern.

## Import Aliases

The linter enforces specific import aliases — builds will fail with incorrect ones.

See the full alias table: @agent_docs/import-aliases.md

## Patterns

### Adding a New Endpoint

1. Create handler in `pkg/handler/v2/<resource>/`
2. Define request/response types in `pkg/api/v2/`
3. Register route in `pkg/handler/routing.go`
4. Use middleware for auth/RBAC

### Testing

Handler tests use mock providers from `pkg/test/`. Run with `go test -tags "ee"` or `go test -tags "ce"` for edition-specific tests.
