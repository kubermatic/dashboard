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
- `src/app/shared/components/` — Reusable UI components (`km-` prefix)
- `src/app/dynamic/enterprise/` — EE-only modules (excluded in CE builds)
- `src/app/dynamic/community/` — CE stubs (excluded in EE builds)
- `src/test/` — Test mocks and fixtures

## CE/EE Edition System

- **Module registry**: `src/app/dynamic/module-registry.ts` (EE) and `module-registry.ce.ts` (CE) swapped via `fileReplacements` in `angular.json`.
- **TypeScript configs**: `src/tsconfig.ee.json` excludes `community/`, `src/tsconfig.ce.json` excludes `enterprise/`.
- **Default**: EE. Set `KUBERMATIC_EDITION=ce` to build CE.

## Testing

- **Unit tests** (Jest): Co-located `component.spec.ts`. Mocks in `src/test/services/`. Import via `@test/*`.
- **E2E tests** (Cypress): See `cypress/CLAUDE.md` for patterns and conventions.
