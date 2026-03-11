# KKP Dashboard — Cypress E2E Tests

E2E test suite using Cypress with Page Object Model pattern and API mocking.

## WHAT
**Entry point:** `cypress/e2e/` (test specs), `cypress.config.ts`
**Modes:** mock (no real backend) via `npm run e2e:mock`, real backend via `npm run e2e`

### Directory Layout
- `e2e/` — test specs (organized by `providers/`, `stories/`, `v2/`)
- `pages/` — Page Object Models (POs): one `.po.ts` file per UI area
- `intercept/` — API mock handlers (`clusters.ts`, `projects.ts`, etc.)
- `fixtures/` — 48 JSON response fixtures
- `support/` — shared test utilities and custom commands
- `utils/` — helper functions

## HOW

### Running Tests
```bash
npm run e2e:mock      # Mock mode (CI-safe, no real KKP backend)
npm run e2e           # Against local dev server with real backend
npm run cy            # Open Cypress UI interactively
```

### Writing Tests
- **Page Objects**: Import from `cypress/pages/`, use fluent methods — never interact with the DOM directly in specs
- **API Mocking**: Add intercepts in `cypress/intercept/`, register them in `beforeEach`
- **Fixtures**: JSON files in `cypress/fixtures/`, loaded via `cy.fixture()`
- **CRITICAL**: Always use page objects — never write raw `cy.get()` selectors in spec files

### Adding a New Test
1. Add page object in `cypress/pages/<feature>.po.ts`
2. Add API intercepts in `cypress/intercept/<feature>.ts`
3. Add fixture JSON files in `cypress/fixtures/<feature>*.json`
4. Write spec in `cypress/e2e/<category>/<feature>.spec.ts`

## VERIFY
```bash
npm run e2e:mock    # Full mock suite passes without a real backend
```
