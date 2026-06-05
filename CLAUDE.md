# KKP Dashboard

Angular web UI + Go REST API for Kubermatic Kubernetes Platform (KKP). Monorepo with two independent modules.

## Monorepo Layout

```
hack/           — CI scripts, boilerplate templates, shared shell utilities
modules/web/    — Angular SPA + Go server (own go.mod, package.json, Makefile)
modules/api/    — Go REST API server (own go.mod, Makefile)
```

## CE/EE Editions

Both modules support Community Edition (CE) and Enterprise Edition (EE) builds. Default is EE. Set `KUBERMATIC_EDITION=ce` for CE builds. See each module's CLAUDE.md for edition details.

## Copyright

New files need license headers. Use boilerplate templates in `hack/boilerplate/` (separate `ce/` and `ee/` dirs).

## Documentation

Official KKP docs: https://docs.kubermatic.com/kubermatic/