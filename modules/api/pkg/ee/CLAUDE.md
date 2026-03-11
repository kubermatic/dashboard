# KKP Dashboard API — Enterprise Edition Features

EE-only features compiled with `//go:build ee`: cluster backups (Velero), resource quotas, group-project bindings, Kyverno policies, metering.

Each feature follows: handler → provider interface → kubernetes implementation → CE stub.

## Adding an EE Feature

1. Create `pkg/ee/<feature>/handler.go` with `//go:build ee` tag
2. Define provider interface in `pkg/ee/<feature>/provider.go`
3. Implement in `pkg/provider/kubernetes/<feature>.go` with `//go:build ee` tag
4. Add CE stub in `cmd/kubermatic-api/wrappers_ce.go` returning `nil`
5. Add EE factory in `cmd/kubermatic-api/wrappers_ee.go`
6. Register routes in `pkg/handler/routing.go` guarded with `if provider != nil`

### CE stub pattern

```go
// wrappers_ce.go — no build tag needed, CE is the !ee default
func createFeatureProvider(...) featureprovider.Provider {
    return nil
}
```
