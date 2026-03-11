# KKP Dashboard — Go REST API

Go REST API server for the KKP Dashboard. Sits between Angular UI and Kubernetes clusters. Uses gorilla/mux routing, Go-Kit endpoint abstraction, and controller-runtime for Kubernetes API access. Authentication via OIDC + Service Account JWT tokens.

## Build Commands

```bash
make build                          # Build binary (EE default)
make build KUBERMATIC_EDITION=ce    # Build CE edition
make kubermatic-api                 # Build API binary only
make clean                          # Clean build artifacts
make lint                           # Run golangci-lint
make fmt                            # Format code
make vet                            # Go vet
make verify                         # Run all verification checks
make api-test                       # Run API tests
make update-codegen                 # Regenerate code (deepcopy, swagger, API client)
make check-dependencies             # Verify go.mod/go.sum
make update-kkp                     # Update KKP/SDK dependencies
```

## Key Directories

- `cmd/kubermatic-api/` — Entry point, server startup, CE/EE wrapper functions
- `pkg/handler/` — HTTP handlers, routing, middleware (v1 legacy, v2 current)
- `pkg/handler/v2/` — Current API endpoint handlers
- `pkg/provider/` — Business logic interfaces (ProjectProvider, ClusterProvider, etc.)
- `pkg/provider/kubernetes/` — Provider implementations using Kubernetes API
- `pkg/api/v1/`, `pkg/api/v2/` — Request/response models
- `pkg/ee/` — Enterprise Edition features (backups, quotas, groups, kyverno, metering)
- `pkg/handler/auth/` — Authentication middleware
- `pkg/validation/` — Input validation
- `pkg/test/` — Test utilities and mock providers

## Architecture

```
HTTP Request → Middleware (auth, RBAC, context) → Handler → Provider → Kubernetes API → Response
```

- **Handlers** (`pkg/handler/`): Parse HTTP, delegate to providers, encode responses. Go-Kit endpoint pattern. v2 is current, v1 is legacy.
- **Providers** (`pkg/provider/`): Business logic interfaces. Implementations in `pkg/provider/kubernetes/` use impersonation clients for RBAC.
- **Middleware** (`pkg/handler/middleware/`): Token verification (OIDC/JWT), user context injection, RBAC checks.
- **Seed-scoped providers**: Many providers are per-seed (cluster, addon, alertmanager). Accessed via getter functions like `ClusterProviderGetter`.

## CE/EE Build Tags

```go
//go:build ee    // EE-only code
//go:build !ee   // CE-only code (stubs)
```

CE stubs in `cmd/kubermatic-api/wrappers_ce.go` return `nil` for EE providers. EE implementations in `pkg/ee/`.

## Import Aliases

The linter enforces specific import aliases — builds will fail with incorrect ones.

See the full alias table: @agent_docs/import-aliases.md

## Patterns

### Adding a New Endpoint

1. Create handler in `pkg/handler/v2/<resource>/`
2. Define request/response types in `pkg/api/v2/`
3. Register route in `pkg/handler/routing.go`
4. Use middleware for auth/RBAC

### Adding EE-Only Feature

1. Create EE handler wrapper in `wrappers_ee.go`
2. Create CE stub in `wrappers_ce.go` (return `nil`)
3. Implement in `pkg/ee/`
4. Use feature gates if needed: `options.featureGates.Enabled(features.FeatureName)`

## Testing

```bash
go test -v ./pkg/handler/v2/cluster/...          # Test specific package
go test -v ./pkg/handler/v1/project -run TestName # Single test
go test -tags "ee" -v ./pkg/handler/...           # EE tests
go test -tags "ce" -v ./pkg/handler/...           # CE tests
```

Handler tests use mock providers from `pkg/test/`.
