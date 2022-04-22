import {Config} from '../utils/config';
import {Provider} from './provider';

export interface Page {
  visit(...params: string[]): void;
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

export interface ClusterListStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface ClusterDetailStrategy {
  onSSHKeyDelete(provider: Provider): void;
  onCreate(provider: Provider): void;
  onDelete(provider: Provider): void;
}

export interface MembersStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface ProjectStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface LoginStrategy {
  login(email: string, password: string, isAdmin: boolean): void;
  logout(): void;
}

export interface ServiceAccountStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface ServiceAccountTokenStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface SSHKeyStrategy {
  onCreate(): void;
  onDelete(): void;
}

export interface WizardStrategy {
  onCreate(provider: Provider): void;
  onSSHKeyAdd(provider: Provider): void;
}
