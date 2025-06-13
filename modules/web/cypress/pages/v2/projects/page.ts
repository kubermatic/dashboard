// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Condition, Page, PageOptions, ProjectStrategy, View} from '@kmtypes';
import {Pages} from '@pages/v2';
import {Config} from '@utils/config';
import _ from 'lodash';
import {ProjectStrategyFactory} from './strategy/factory';

export class Projects extends PageOptions implements Page {
  private static _projectName: string;
  private readonly _strategy: ProjectStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = ProjectStrategyFactory.new(isAPIMocked);
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

  open(projectName: string): void {
    this.visit();
    Pages.expect(View.Projects.Default);

    this.Elements.projectItem(projectName).should(Condition.Exist);
    this.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    this.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
    this.select(projectName);
    Pages.expect(View.Overview.Default);
  }

  create(name: string): void {
    this.Buttons.openDialog.click({force: true});
    this.Elements.addDialogInput.should(Condition.BeVisible).should(Condition.NotBeDisabled);
    this.Elements.addDialogInput.type(name, { force: true }).then(_ => this._strategy?.onCreate());
    this.Buttons.addDialogConfirm.click();
  }

  select(name: string): void {
    this.Elements.projectItem(name).click({force: true});
  }

  delete(name: string): void {
    this.Buttons.deleteDialog(name).should(Condition.Exist).should(Condition.BeEnabled);
    this.Buttons.deleteDialog(name).click({force: true});
    this.Buttons.deleteDialogInput.type(name);
    this.Buttons.deleteDialogConfirm.click().then(_ => this._strategy?.onDelete());
  }
}

class Elements extends PageOptions {
  projectItem(name: string, timeout?: number): Cypress.Chainable {
    return this._get(`#km-project-name-${name}`, timeout);
  }

  /**
   *  This method will only find the expected icon if it already exists on the page.
   *  It will not retry and wait. Instead, you should add assertions to make sure that previous
   *  icon does not exist anymore and then make assertion to expect that this one exists.
   *
   *  Example:
   *   Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
   *   Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
   **/
  projectItemIcon(name: string, status: string): Cypress.Chainable {
    return this._get(`#km-project-name-${name}`).parent().find(`i.km-icon-${status}`);
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

  projectViewType(type: 'projectscard' | 'projectstable'): Cypress.Chainable {
    return this._get(`mat-button-toggle[value=${type}].mat-button-toggle-checked`);
  }
}
