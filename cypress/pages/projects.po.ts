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
import {Endpoint} from '../utils/endpoint';
import {Property, RequestType, Response, ResponseType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';
import {ClustersPage} from './clusters.po';

export class ProjectsPage {
  static getProjectItem(projectName: string): Cypress.Chainable {
    return cy.get(`#km-project-name-${projectName}`);
  }

  static getActiveProjects(): Cypress.Chainable {
    return cy.get('i.km-health-state.km-icon-circle.km-success-bg');
  }

  static getAddProjectBtn(): Cypress.Chainable {
    return cy.get('#km-add-project-top-btn');
  }

  static getAddProjectInput(): Cypress.Chainable {
    return cy.get('#km-add-project-dialog-input');
  }

  static getAddProjectConfirmBtn(): Cypress.Chainable {
    return cy.get('#km-add-project-dialog-save');
  }

  static getDeleteProjectBtn(projectName: string): Cypress.Chainable {
    return cy.get(`#km-delete-project-${projectName}`);
  }

  static getEditProjectBtn(projectName: string): Cypress.Chainable {
    return cy.get(`#km-edit-project-${projectName}`);
  }

  static getEditDialogInput(): Cypress.Chainable {
    return cy.get('#km-edit-project-dialog-input');
  }

  static getEditDialogConfirmBtn(): Cypress.Chainable {
    return cy.get('#km-edit-project-dialog-edit-btn');
  }

  static getAppEdition(): Cypress.Chainable {
    return cy.get('#km-edition');
  }

  static getDialogCloseButton(): Cypress.Chainable {
    return cy.get('#km-close-dialog-btn');
  }

  static getConnectClusterBtn(): Cypress.Chainable {
    return cy.get('#km-connect-cluster-top-btn');
  }

  // Utils.

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.Projects).interceptAndWait();
  }

  static waitForProject(projectName: string): void {
    const retries = 5;
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Projects)
      .retry(retries)
      .expect(Response.newResponse(ResponseType.LIST).elements(1).property(Property.newProperty('name', projectName)));
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Projects.Default);
  }

  static visit(): void {
    cy.visit('/').then(() => {
      this.waitForRefresh();
      this.verifyUrl();
    });
  }

  static visitUsingHeader(): void {
    cy.get('.km-header-logo')
      .click()
      .then(() => {
        this.waitForRefresh();
        this.verifyUrl();
      });
  }

  static selectProject(projectName: string): void {
    const waitTime = 500;
    this.getProjectItem(projectName).should(Condition.HaveLength, 1);
    this.getActiveProjects()
      .should(Condition.HaveLength, 1)
      .wait(waitTime)
      .click()
      .then(() => {
        ClustersPage.waitForRefresh();
        ClustersPage.verifyUrl();
      });
  }

  static addProject(projectName: string): void {
    this.getAddProjectBtn().should(Condition.BeEnabled).click();
    this.getAddProjectInput().type(projectName).should(Condition.HaveValue, projectName);
    this.getAddProjectConfirmBtn()
      .should(Condition.BeEnabled)
      .click()
      .then(() => {
        cy.reload();
        this.waitForProject(projectName);
        this.getProjectItem(projectName).should(Condition.HaveLength, 1);
      });
  }

  static deleteProject(projectName: string): void {
    const retries = 5;
    this.getDeleteProjectBtn(projectName).should(Condition.BeEnabled).click();
    cy.get('#km-delete-project-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-delete-project-dialog-confirm-btn')
      .should(Condition.BeEnabled)
      .click()
      .then(() => {
        TrafficMonitor.newTrafficMonitor()
          .method(RequestType.GET)
          .url(Endpoint.Projects)
          .retry(retries)
          .expect(Response.newResponse(ResponseType.LIST).elements(0));
      });
  }
}
