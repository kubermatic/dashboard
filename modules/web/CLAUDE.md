# KKP Dashboard — Angular Frontend

Angular SPA for Kubermatic Kubernetes Platform. Angular 21.x, TypeScript, Angular Material, RxJS. CE/EE editions via build-time module swapping. Also contains a Go server binary (`cmd/dashboard/`) that serves the SPA in production.

## Commands

```bash
# Dev
npm start                        # Dev server localhost:8000 (EE default)
npm run start:local              # Dev with local API proxy (127.0.0.1:8080)
KUBERMATIC_EDITION=ce npm start  # Dev CE edition

# Build
npm run build                    # Production build

# Test
npm run test:ci                  # Jest with coverage
npm run e2e:mock                 # Cypress E2E, mocked API

# Lint / format
npm run check                    # All checks (TS, SCSS, licenses)
npm run fix                      # Auto-fix all (TS, SCSS, HTML, licenses)
```

## Key Directories

- `cmd/dashboard/` — Go binary serving the SPA in production
- `src/app/core/services/` — Singleton API services, auth guards
- `src/app/shared/` — Reusable `km-` components, entities, utils, `KmValidators` + regex
- `src/app/dynamic/enterprise/` — EE-only modules (excluded CE builds)
- `src/app/dynamic/community/` — CE stubs (excluded EE builds)
- `src/test/` — Test mocks, fixtures

## CE/EE Edition System

- **Registry**: `module-registry.ts` (EE) / `module-registry.ce.ts` (CE), swapped via `fileReplacements` in `angular.json`. CE stubs share exports but import empty modules from `community/`.
- **EE modules**: Theming, AllowedRegistries, Metering, Quotas, Group, ClusterBackups, KyvernoPolicies.
- **tsconfig**: `tsconfig.ee.json` excludes `community/`; `tsconfig.ce.json` excludes `enterprise/`.
- **Default**: EE. Set `KUBERMATIC_EDITION=ce` → CE.

## Testing

- **Jest**: Co-located `component.spec.ts`. Mocks in `src/test/services/` (`[Service]MockService`, `useClass`). Factories `fake[Entity]()` in `src/test/data/`. Import via `@test/*`.
- **Cypress**: See `cypress/CLAUDE.md`.
- No `fdescribe`/`fit` (break CI), no `xit`/`xdescribe`. Use `NoopAnimationsModule`.

## Critical Rules (must follow)

Non-obvious conventions. Check `src/app/shared/` (validators, regex, utils, entities, `km-` components) before adding code.

- Path aliases, never relative cross-module: `@app @core @shared @dynamic @test @environments @assets`.
- Reactive forms only. `KmValidators` facade + regex from `@shared/validators/` — never inline.
- Editions: never import `enterprise/`/`community/` directly → use `DynamicModule` namespace (`DynamicModule.isEnterpriseEdition`). New EE feature → module in `dynamic/enterprise/`, lazy import in both `module-registry.ts` + `module-registry.ce.ts` (stub).