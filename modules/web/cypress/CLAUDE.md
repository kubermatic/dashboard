# KKP Dashboard — Cypress E2E Tests

Cypress 14 E2E suite. Mock mode (`npm run e2e:mock`) needs no backend. Page Object Model pattern throughout.

## Rules

- **Always use page objects** — never write raw `cy.get()` selectors in spec files
- Import POs from `cypress/pages/`, use fluent methods for all DOM interaction
- Register API intercepts from `cypress/intercept/` in `beforeEach`

## Adding a New Test

1. Add page object in `pages/<feature>.po.ts`
2. Add API intercepts in `intercept/<feature>.ts`
3. Add fixture JSON in `fixtures/`
4. Write spec in `e2e/<category>/<feature>.spec.ts`
