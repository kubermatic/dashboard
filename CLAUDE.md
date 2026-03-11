# CLAUDE.md

Kubermatic Dashboard — Angular web UI + Go REST API for the Kubermatic Kubernetes Platform (KKP). Monorepo with two independent modules, each with its own CLAUDE.md:

- `modules/api/` — Go backend (gorilla/mux, Go-Kit, controller-runtime)
- `modules/web/` — Angular frontend (Angular 20.x, Angular Material, RxJS)

## CE/EE Editions

Default is **EE**. Both modules support CE/EE — see each module's CLAUDE.md for edition-specific mechanics.

## Copyright

New files must include license headers from `hack/boilerplate/ce/` or `hack/boilerplate/ee/`. Run `npm run fix:license` (web) or `hack/verify-boilerplate.sh` to verify.


## Documentation
Official KKP documentation: https://docs.kubermatic.com/kubermatic/