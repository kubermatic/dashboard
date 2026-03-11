# KKP Dashboard — Cypress E2E Tests

E2E test suite using Cypress with Page Object Model pattern and API mocking.

**Modes:** mock (no real backend) via `npm run e2e:mock`, real backend via `npm run e2e`

```bash
npm run cy            # Open Cypress UI interactively
```

## Key Directories

- `e2e/` — test specs (organized by `providers/`, `stories/`, `v2/`)
- `pages/` — Page Object Models (POs): one `.po.ts` file per UI area
- `intercept/` — API mock handlers
- `fixtures/` — JSON response fixtures
- `support/` — shared test utilities and custom commands

## Writing Tests

**CRITICAL**: Always use page objects from `cypress/pages/` — never write raw `cy.get()` selectors in spec files.

- **API Mocking**: Add intercepts in `cypress/intercept/`, register them in `beforeEach`
- **Fixtures**: JSON files in `cypress/fixtures/`, loaded via `cy.fixture()`

### Adding a New Test

1. Add page object in `cypress/pages/<feature>.po.ts`
2. Add API intercepts in `cypress/intercept/<feature>.ts`
3. Add fixture JSON files in `cypress/fixtures/<feature>*.json`
4. Write spec in `cypress/e2e/<category>/<feature>.spec.ts`
