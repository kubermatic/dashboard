# KKP Dashboard — Angular Frontend

Angular 20.x SPA for the Kubermatic Kubernetes Platform. TypeScript, Angular Material, RxJS.

## Common Commands

```bash
npm start                        # Dev server at localhost:8000
npm test                         # Jest unit tests
npm run check                    # All checks (TS, SCSS, licenses)
npm run fix                      # Auto-fix all issues
```

## CE/EE Edition System

- **Module registry**: `src/app/dynamic/module-registry.ts` (EE) / `module-registry.ce.ts` (CE) — swapped via `fileReplacements` in `angular.json`
- **TypeScript configs**: `src/tsconfig.ee.json` excludes `community/`, `src/tsconfig.ce.json` excludes `enterprise/`
- **Default**: EE. Set `KUBERMATIC_EDITION=ce` for CE builds.

## Key Directories

- `src/app/core/services/` — Singleton API client services, auth guards
- `src/app/shared/` — Reusable UI components (`km-` prefix), entity types, validators, utils
- `src/app/dynamic/enterprise/` — EE-only modules (theming, registries, metering, quotas, groups, backups, kyverno)
- `src/app/dynamic/community/` — CE stubs with same interface
- `src/app/wizard/` — Cluster creation wizard
- `cypress/` — E2E test suite (has own CLAUDE.md)

## Conventions

- **Component prefix**: `km-` (e.g., `selector: 'km-clusters'`)
- **File naming**: `component.ts`, `template.html` (not `component.html`), `component.spec.ts`
- **Path aliases**: `@app/*`, `@core/*`, `@shared/*`, `@environments/*`, `@test/*`, `@assets/*`
- **State management**: RxJS observables in core services, no Redux/NgRx. `shareReplay()` for caching, `merge()` + `switchMap()` for refresh.
- **Change detection**: `ChangeDetectionStrategy.OnPush` on all components.
- **Routing**: All feature modules lazy-loaded via `loadChildren`.

## Testing

- **Unit tests** (Jest): Co-located `component.spec.ts`. Mocks in `src/test/services/`. Import via `@test/*`.
- **E2E tests** (Cypress): See `cypress/CLAUDE.md` for patterns and conventions.
