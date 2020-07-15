// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Condition} from '../utils/condition';
import {wait} from '../utils/wait';
import {ClustersPage} from './clusters.po';

export class ProjectsPage {
  static getProjectItem(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-project-name-${projectName}`);
  }

  static getActiveProjects(): Cypress.Chainable<any> {
    return cy.get('i.km-health-state.km-icon-mask.km-icon-circle.km-success-bg');
  }

  static getAddProjectBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-project-top-btn');
  }

  static getAddProjectInput(): Cypress.Chainable<any> {
    return cy.get('#km-add-project-dialog-input');
  }

  static getAddProjectConfirmBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-project-dialog-save');
  }

  static getDeleteProjectBtn(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-delete-project-${projectName}`);
  }

  static getEditProjectBtn(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-edit-project-${projectName}`);
  }

  static getEditDialogInput(): Cypress.Chainable<any> {
    return cy.get('#km-edit-project-dialog-input');
  }

  static getEditDialogConfirmBtn(): Cypress.Chainable<any> {
    return cy.get('#km-edit-project-dialog-edit-btn');
  }

  static getAppEdition(): Cypress.Chainable {
    return cy.get('#km-edition');
  }

  // Utils.

  static waitForRefresh(): void {
    wait('**/projects?displayAll=false', 'GET', 'list projects');
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, 'projects');
  }

  static visit(): void {
    cy.get('#km-nav-item-projects')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static selectProject(projectName: string): void {
    this.getProjectItem(projectName).should(Condition.HaveLength, 1);
    this.getActiveProjects()
      .should(Condition.HaveLength, 1)
      .wait(500)
      .click()
      .then(() => {
        ClustersPage.waitForRefresh();
        ClustersPage.verifyUrl();
      });
  }

  static addProject(projectName: string): void {
    this.getAddProjectBtn().should(Condition.NotBe, 'disabled').click();
    this.getAddProjectInput().type(projectName).should(Condition.HaveValue, projectName);
    this.getAddProjectConfirmBtn()
      .should(Condition.NotBe, 'disabled')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.getProjectItem(projectName).should(Condition.HaveLength, 1);
      });
  }

  static deleteProject(projectName: string): void {
    this.getDeleteProjectBtn(projectName).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  }
}
