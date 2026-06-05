# KKP Dashboard — Go REST API

REST API server (Go). Backend for KKP Dashboard. Manage clusters, projects, users, seeds, other resources.

**Type**: HTTP REST API Server (Go) | **Port**: 8080 | **Framework**: Gorilla Mux + Go-Kit
**Auth**: OIDC + Service Account JWT | **Storage**: Kubernetes API (controller-runtime client)

## Commands

```bash
make build                          # Build binary (EE default) → _build/kubermatic-api
make build KUBERMATIC_EDITION=ce    # Build CE edition
make api-test                       # Run API tests (gocache + build-tests)
make lint                           # golangci-lint (import aliases enforced)
make verify                         # verify-go + verify-imports + check-dependencies
make update-codegen                 # Regenerate code (tidy, vendor, fmt, swagger, API client)
make update-kkp                     # Update KKP/SDK dependencies + run codegen
make fmt                            # go fmt
make vet                            # go vet
```

## Testing

```bash
go test -v ./pkg/handler/v2/cluster/...          # Test specific package
go test -v ./pkg/handler/v1/project -run TestName # Single test
go test -tags "ee" -v ./pkg/handler/...           # EE tests
go test -tags "ce" -v ./pkg/handler/...           # CE tests
```

Handler tests use mock providers from `pkg/test/`.

## Key Directories

- `cmd/kubermatic-api/` — Entry point + startup. `main.go`, `options.go`, `metrics.go`, `wrappers_ce.go`/`wrappers_ee.go` (CE/EE factory split), `swagger.json`
- `pkg/handler/` — Routing + middleware. `routing.go`, `routes_v1.go`, `routes_v1_admin.go`, `routes_v1_optional.go`, `routes_v1_websocket.go`, `handler.go`
- `pkg/handler/v1/` — Legacy V1 handlers
- `pkg/handler/v2/` — Current V2 handlers (one dir per resource: `cluster/`, `machine/`, `user/`, etc.), `routes_v2.go`, `routing.go`
- `pkg/handler/middleware/` — Middleware (auth, context injection, RBAC)
- `pkg/provider/` — Business logic interfaces (ProjectProvider, ClusterProvider, …); `kubernetes/` = K8s-client implementations
- `pkg/api/v1/`, `pkg/api/v2/` — Request/response models
- `pkg/ee/` — EE features (clusterbackup, resource-quota, group-project-binding, kyverno, metering, provider) — own CLAUDE.md
- `pkg/validation/` — Input validation · `pkg/test/` — mock providers + test utilities
- `pkg/serviceaccount/`, `pkg/watcher/`, `pkg/resources/`, `pkg/version/` — SA tokens, resource watchers, shared resources, version handling

## Main Entry Point

**File**: `cmd/kubermatic-api/main.go`

Startup: Parse flags → Setup logging → Register K8s schemes → Create controller manager → Create providers (`createInitProviders()`) → Create auth clients (`createAuthClients()`) → Register HTTP routes (`createAPIHandler()`) → Start server.

## Core Architecture

Core patterns: Handler (Go-Kit endpoint), Provider (business logic interfaces), Middleware (auth chain), Impersonation (per-user K8s RBAC).

## API Versions

- **V1** (`/api/v1/*`) — legacy, routes in `pkg/handler/routes_v1*.go`
- **V2** (`/api/v2/*`) — current, consistent CRUD. Routes in `pkg/handler/v2/routes_v2.go`, one handler dir per resource.

## CE/EE Build Tags

**CRITICAL**: EE-only code in `pkg/ee/` with `//go:build ee` tag. Edition split via paired factory files in `cmd/kubermatic-api/`:
- `wrappers_ee.go` (`//go:build ee`) — delegates to real implementations in `pkg/ee/`
- `wrappers_ce.go` (`//go:build !ee`) — returns `nil` for EE-only providers; some functions (e.g. `seedsGetterFactory`) have real CE implementations

EE-only providers (nil in CE): `resourceQuotaProvider`, `groupProjectBinding`, `backupStorageProvider`, `policyTemplateProvider`.

## Key Concepts

Seeds (K8s clusters hosting user clusters), Projects (resource scope), UserInfo (auth context from middleware), Privileged Providers (bypass RBAC for admin ops).

## Key Technologies

Gorilla Mux (routing), Go-Kit (endpoints), Controller-Runtime (K8s client/cache), Prometheus (metrics), Zap (logging), go-oidc (OIDC auth), JWT (service accounts)

## Import Aliases

Strict import aliasing enforced by golangci-lint (`importas` rule). Import ordering by `gimps`. Key aliases: `kubermaticv1`, `apiv1`/`apiv2`, `corev1`, `metav1`, `ctrlruntimeclient`, `utilerrors`, `authtypes`.

## Metrics

Prometheus metrics on internal metrics address. HTTP request metrics: method, path, status code, duration.
