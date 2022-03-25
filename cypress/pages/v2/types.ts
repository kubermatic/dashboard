import {Config} from '../../utils/config';

export interface Page {
  visit(): void;
}

export abstract class PageOptions {
  protected _get(selector: string, timeout = this._elementLoadTimeout): Cypress.Chainable {
    return cy.get(selector, {timeout});
  }

  protected _contains(match: string): Cypress.Chainable {
    return cy.contains(match, {timeout: this._elementLoadTimeout});
  }

  constructor(
    protected readonly _elementLoadTimeout = Config.defaultElementLoadTimeout,
    protected readonly _pageLoadTimeout = Config.defaultPageLoadTimeout
  ) {}
}
