import {Condition} from '../utils/condition';
import {Endpoint} from '../utils/endpoint';
import {Property, RequestType, Response, ResponseType, TrafficMonitor} from '../utils/monitor';
import {View} from '../utils/view';
import {ClustersPage} from './clusters.po';

export class ProjectsPage {
  static getProjectItem(projectName: string): Cypress.Chainable<any> {
    return cy.get(`#km-project-name-${projectName}`);
  }

  static getActiveProjects(): Cypress.Chainable<any> {
    return cy.get('i.km-health-state.fa.fa-circle.km-success');
  }

  static getAddProjectBtn(): Cypress.Chainable<any> {
    return cy.get('#km-add-project-top-btn', {timeout: 10000});
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

  // Utils.

  static waitForRefresh(): void {
    TrafficMonitor.newTrafficMonitor().method(RequestType.GET).url(Endpoint.Projects).alias('listProjects').wait();
  }

  static waitForProject(projectName: string): void {
    TrafficMonitor.newTrafficMonitor()
      .method(RequestType.GET)
      .url(Endpoint.Projects)
      .alias('listProjects')
      .retry(5)
      .expect(Response.newResponse(ResponseType.LIST).elements(1).property(Property.newProperty('name', projectName)));
  }

  static verifyUrl(): void {
    cy.url().should(Condition.Include, View.Projects);
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
    cy.reload();
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
        this.waitForProject(projectName);
        this.getProjectItem(projectName).should(Condition.HaveLength, 1);
      });
  }

  static deleteProject(projectName: string): void {
    this.getDeleteProjectBtn(projectName).should(Condition.NotBe, 'disabled').click();
    cy.get('#km-confirmation-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
    cy.get('#km-confirmation-dialog-confirm-btn').should(Condition.NotBe, 'disabled').click();
  }
}
