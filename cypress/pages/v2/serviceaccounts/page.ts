import {Group} from '../../../utils/member';
import {Page, PageOptions} from '../types';
import {ServiceAccountStrategyFactory, ServiceAccountTokenStrategyFactory} from './strategy/factory';
import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from './strategy/types';

export class ServiceAccounts extends PageOptions implements Page {
  private readonly _strategy: ServiceAccountStrategy | undefined;
  private readonly _tokenStrategy: ServiceAccountTokenStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = ServiceAccountStrategyFactory.new(isAPIMocked);
    this._tokenStrategy = ServiceAccountTokenStrategyFactory.new(isAPIMocked);
  }

  static getName(): string {
    return 'test-sa';
  }

  static getTokenName(): string {
    return 'test-token';
  }

  visit(): void {
    this.Elements.navButton.click();
  }

  create(name: string, group: Group): void {
    this.Buttons.openDialog.click();
    this.Elements.createDialogNameInput.type(name);
    this.Elements.createDialogGroupSelect(group).click();
    this.Buttons.createDialogConfirm.click().then(_ => this._strategy?.onCreate());
  }

  delete(name: string): void {
    this.Buttons.deleteDialog(name).click();
    this.Buttons.deleteDialogConfirm.click().then(_ => this._strategy?.onDelete());
  }

  addToken(name: string): void {
    this.Buttons.openTokenDialog.click();
    this.Elements.addTokenDialogNameInput.type(name);
    this.Buttons.addToken.click();
    this.Buttons.gotIt.click().then(_ => this._tokenStrategy?.onCreate());
  }
}

class Elements extends PageOptions {
  get navButton(): Cypress.Chainable {
    return this._get('#km-nav-item-service-accounts');
  }

  get createDialogNameInput(): Cypress.Chainable {
    return this._get('#km-create-serviceaccount-dialog-name-input');
  }

  get addTokenDialogNameInput(): Cypress.Chainable {
    return this._get('#km-serviceaccount-token-dialog-name-input');
  }

  createDialogGroupSelect(group: Group): Cypress.Chainable {
    return this._get('mat-radio-button').contains('div', group);
  }
}

class Buttons extends PageOptions {
  get addToken(): Cypress.Chainable {
    return this._get('#km-serviceaccount-token-dialog-update-btn');
  }

  get gotIt(): Cypress.Chainable {
    return this._get('#km-serviceaccount-token-dialog-confirm-btn');
  }

  get openTokenDialog(): Cypress.Chainable {
    return this._get('#km-add-serviceaccount-token');
  }

  get createDialogConfirm(): Cypress.Chainable {
    return this._get('#km-create-serviceaccount-dialog-create-btn');
  }

  get deleteDialogConfirm(): Cypress.Chainable {
    return this._get('#km-confirmation-dialog-confirm-btn');
  }

  get openDialog(): Cypress.Chainable {
    return this._get('#km-create-serviceaccount-top-btn');
  }

  get table(): Cypress.Chainable {
    return this._get('tbody');
  }

  get tokenTable(): Cypress.Chainable {
    return this._get('km-serviceaccount-token');
  }

  deleteDialog(name: string): Cypress.Chainable {
    return this.tableRow(name).parent().find('button i.km-icon-delete');
  }

  tableRow(name: string): Cypress.Chainable {
    return this._contains(name);
  }

  tokenTableRow(name: string): Cypress.Chainable {
    return this._contains(name);
  }
}
