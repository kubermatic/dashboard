# KKP Dashboard API — Enterprise Edition Features

EE-only features compiled with `//go:build ee`: cluster backups (Velero), resource quotas, group-project bindings, Kyverno policies (policy-template, policy-binding), metering.

## Build Tag

**EE code**: `//go:build ee`
**CE stubs**: `//go:build !ee`
**Pattern per feature:** handler → provider interface → K8s implementation → CE stub (nil)

## EE Feature Directories

- `clusterbackup/` — Velero-based cluster backup/restore
- `resource-quota/` — project resource quotas
- `group-project-binding/` — OIDC group → project role mapping
- `kyverno/` — Kyverno policy template + binding management
- `metering/` — usage metering and reporting
- `provider/` — EE-specific cloud provider extensions
- `cmd/` — EE startup wiring (`SeedsGetterFactory`, provider factories)

## Adding an EE Feature

1. Create `pkg/ee/<feature>/handler.go` with `//go:build ee` tag
2. Define provider interface `pkg/ee/<feature>/provider.go`
3. Implement `pkg/provider/kubernetes/<feature>.go` with `//go:build ee` tag
4. CE stub `cmd/kubermatic-api/wrappers_ce.go` (`//go:build !ee`) returns `nil`
5. EE factory `cmd/kubermatic-api/wrappers_ee.go` (`//go:build ee`) delegates to `pkg/ee/cmd/`
6. Register routes in `pkg/handler/v2/routes_v2.go` — guard with `if provider != nil`

## Verify

```bash
go test -tags "ee" ./pkg/ee/...
go test -tags "ce" ./pkg/handler/...    # CE stubs must compile cleanly
```