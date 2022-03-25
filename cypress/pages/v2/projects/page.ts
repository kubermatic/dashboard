import _ from 'lodash';
import {Config} from '../../../utils/config';
import {View} from '../../../utils/view';
import {Page, PageOptions} from '../types';
import {ProjectStateFactory} from './state/factory';
import {ProjectState} from './state/types';

export class Projects extends PageOptions implements Page {
  private static _projectName: string;
  private readonly _state: ProjectState;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._state = ProjectStateFactory.new(isAPIMocked);
  }

  static getName(): string {
    if (!this._projectName) {
      const prefix = 'test-project';
      this._projectName = Config.isAPIMocked() ? prefix : _.uniqueId(`${prefix}-`);
    }

    return this._projectName;
  }

  visit(): void {
    cy.visit(View.Projects.Default, {timeout: this._pageLoadTimeout});
  }

  create(name: string): void {
    this.Buttons.openDialog.click();
    this.Elements.addDialogInput.type(name);
    this.Buttons.addDialogConfirm.click().then(_ => this._state.onCreate());
  }

  select(name: string): void {
    this.Elements.projectItem(name).click();
  }

  delete(name: string): void {
    this.Buttons.deleteDialog(name).click();
    this.Buttons.deleteDialogInput.type(name);
    this.Buttons.deleteDialogConfirm.click().then(_ => this._state.onDelete());
  }
}

class Elements extends PageOptions {
  projectItem(name: string): Cypress.Chainable {
    return this._get(`#km-project-name-${name}`);
  }

  get edition(): Cypress.Chainable {
    return this._get('#km-edition');
  }

  get addDialogInput(): Cypress.Chainable {
    return this._get('#km-add-project-dialog-input');
  }
}

class Buttons extends PageOptions {
  get openDialog(): Cypress.Chainable {
    return this._get('#km-add-project-top-btn');
  }

  deleteDialog(name: string): Cypress.Chainable {
    return this._get(`#km-delete-project-${name}`);
  }

  get deleteDialogInput(): Cypress.Chainable {
    return this._get('#km-delete-project-dialog-input');
  }

  get deleteDialogConfirm(): Cypress.Chainable {
    return this._get('#km-delete-project-dialog-confirm-btn');
  }

  get closeDialog(): Cypress.Chainable {
    return this._get('#km-close-dialog-btn');
  }

  get addDialogConfirm(): Cypress.Chainable {
    return this._get('#km-add-project-dialog-save');
  }
}
