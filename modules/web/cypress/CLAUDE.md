# KKP Dashboard — Cypress E2E Tests

Cypress + Page Object Model + API mocking. `cypress-fail-fast` for early abort.

**Modes:** `npm run e2e:mock` (mocked API), `npm run e2e` (real backend), `npm run cy` (headless)

## Key Directories

- `e2e/v2/stories/` — **Current specs** (v2 PO system)
- `e2e/stories/` — Legacy specs (v1 PO system)
- `pages/v2/` — Current Page Objects (instance-based, strategy pattern)
- `pages/*.po.ts` — Legacy Page Objects (static methods)
- `intercept/` — API mock handlers. `Intercept` facade
- `fixtures/` — JSON response fixtures
- `types/` — Typed enums (`Fixtures`, `Endpoints`, `Condition`, `View`, `Provider`). Import `@kmtypes`
- `utils/` — Legacy utilities (`Config`, `Mocks`, `TrafficMonitor`)
- `support/` — Custom commands + global setup

## Path Aliases

`@kmtypes` → `types/`, `@intercept` → `intercept/`, `@pages/*` → `pages/`, `@utils/*` → `utils/`

## Page Object Systems

**V2 (use for new tests):** `Pages` facade in `pages/v2/pages.ts`. Instance-based POs with Strategy pattern (mock vs real). `Intercept.init()` in `beforeEach` sets up all mocks. Available: `Root`, `Dex`, `Projects`, `Members`, `ServiceAccounts`, `Clusters`, `SSHKeys`, `Wizard`, `AdminSettings`, `UserSettings`.

**V1 (legacy):** Static PO classes in `pages/*.po.ts`. Do not use for new tests.


## Writing New Tests

1. Page object → `pages/v2/<feature>/page.ts`
2. Strategy → `pages/v2/<feature>/strategy/` (mocked + real + factory)
3. Intercepts → `intercept/<feature>.ts`
4. Fixtures → `fixtures/<feature>*.json`
5. Spec → `e2e/v2/stories/<feature>.spec.ts`

**CRITICAL**: Use page objects — never raw `cy.get()` in specs. Use `Condition` enum for 
assertions.


## API Mocking

`Intercept.init(provider?)` sets up all mocks. Each intercept class has `onCreate()`/`onDelete()` to swap fixtures for state changes. Typed enums in `types/` define fixture paths, endpoint patterns, and assertion strings.
