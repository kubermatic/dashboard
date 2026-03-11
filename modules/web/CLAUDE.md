# KKP Dashboard — Angular Frontend

Angular SPA for the Kubermatic Kubernetes Platform. Uses Angular 20.x, TypeScript, Angular Material, and RxJS. Supports CE and EE editions via build-time module swapping.

## Build Commands

```bash
npm start                           # Dev server at localhost:8000 (EE default)
npm run start:local                 # Dev with local API proxy (127.0.0.1:8080)
KUBERMATIC_EDITION=ce npm start     # Dev CE edition
npm run build                       # Production build
npm run build:themes                # Build + extract theme bundles

npm run test:ci                     # Jest with coverage
npm run e2e:mock                    # Cypress E2E with mocked API
npm run e2e                         # Cypress E2E against dev server

npm run check                       # All checks (TS, SCSS, licenses)
npm run fix                         # Auto-fix all (TS, SCSS, HTML, licenses)
```

## Key Directories

- `src/app/core/services/` — Singleton API client services, auth guards
- `src/app/core/services/provider/` — Cloud provider services (AWS, GCP, Azure, etc.)
- `src/app/core/interceptors/` — HTTP interceptors (auth token, errors, loader)
- `src/app/shared/components/` — Reusable UI components (`km-` prefix)
- `src/app/shared/entity/` — Data model types
- `src/app/shared/validators/` — Form validators
- `src/app/shared/utils/` — Utility functions
- `src/app/dynamic/enterprise/` — EE-only modules (excluded in CE builds)
- `src/app/dynamic/community/` — CE stubs (excluded in EE builds)
- `src/app/wizard/` — Cluster creation wizard (multi-step)
- `src/app/cluster/` — Cluster management
- `src/app/project/` — Project management
- `src/app/node-data/` — Node/machine deployment config
- `src/app/backup/` — Backup management
- `src/app/routing.ts` — Main routing (lazy-loaded feature modules)
- `src/test/` — Test mocks and fixtures
- `cypress/` — E2E suite (page objects in `pages/`, API mocks in `intercept/`)

## CE/EE Edition System

- **Module registry**: `src/app/dynamic/module-registry.ts` (EE) and `module-registry.ce.ts` (CE). Angular `fileReplacements` in `angular.json` swap them at build time.
- **TypeScript configs**: `src/tsconfig.ee.json` excludes `community/`, `src/tsconfig.ce.json` excludes `enterprise/`.
- **EE modules**: Theming, Allowed Registries, Metering, Quotas, Groups, Cluster Backups, Kyverno Policies.
- **CE modules**: Lightweight stubs with same interface.
- **Default**: EE. Set `KUBERMATIC_EDITION=ce` to build CE.

## Conventions

- **Component prefix**: `km-` (e.g., `selector: 'km-clusters'`)
- **File naming**: `component.ts`, `template.html` (not `component.html`), `component.spec.ts`
- **Path aliases**: `@app/*`, `@core/*`, `@shared/*`, `@environments/*`, `@test/*`, `@assets/*`
- **State management**: RxJS observables in core services, no Redux/NgRx. Services use `shareReplay()` for caching, `merge()` + `switchMap()` for refresh patterns.
- **Change detection**: `ChangeDetectionStrategy.OnPush` on most components.
- **Routing**: All feature modules lazy-loaded via `loadChildren`.

## Testing

- **Unit tests** (Jest): Co-located `component.spec.ts`. Mocks in `src/test/services/`. Import via `@test/*`.
- **E2E tests** (Cypress): See `cypress/CLAUDE.md` for patterns and conventions.
