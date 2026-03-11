# KKP Dashboard

Angular web UI + Go REST API for the Kubermatic Kubernetes Platform (KKP). Monorepo with two independent modules:

- Go backend: @modules/api/CLAUDE.md
- Angular frontend: @modules/web/CLAUDE.md

Each module has its own CLAUDE.md with module-specific commands, patterns, and directory guides.

## Build Commands

```bash
# API (from modules/api/)
make build                          # Build binary (EE default)
make build KUBERMATIC_EDITION=ce    # Build CE
make lint                           # golangci-lint
make api-test                       # Run API tests
make update-codegen                 # Regenerate code after type/API changes

# Web (from modules/web/)
npm start                           # Dev server at localhost:8000
npm run build                       # Production build
npm test                            # Jest unit tests
npm run e2e:mock                    # Cypress E2E with mocked API
npm run check                       # All checks (TS, SCSS, licenses)
npm run fix                         # Auto-fix all issues
```

## CE/EE Editions

Both modules support Community Edition (CE) and Enterprise Edition (EE):

- **Go backend**: Build tags (`//go:build ee` / `//go:build !ee`). EE code in `pkg/ee/`. CE stubs in `wrappers_ce.go`. Set `KUBERMATIC_EDITION=ce` or `ee` for builds.
- **Angular frontend**: Build-time file replacement via `angular.json`. EE modules in `src/app/dynamic/enterprise/`, CE stubs in `src/app/dynamic/community/`. Module registry swapped at build: `module-registry.ts` (EE) vs `module-registry.ce.ts` (CE). TypeScript configs: `tsconfig.ee.json` excludes community, `tsconfig.ce.json` excludes enterprise.
- **Default edition**: EE (both modules).

## Copyright

New files require licenses. Do not write the license manually—always use the boilerplate templates in `hack/boilerplate/` or run the appropriate fixer tool.

Run `npm run fix:license` (web) or check `hack/verify-boilerplate.sh` for verification.


## Documentation
Official KKP documentation: https://docs.kubermatic.com/kubermatic/
