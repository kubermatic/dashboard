import {Condition} from "../utils/condition";

export class ProjectsPage {
    static visit(): void {
        cy.get('#km-nav-item-projects').click();
    }

    static selectProject(projectName: string): void {
      cy.get(`#km-project-name-${projectName}`).should(Condition.HaveLength, 1);
      cy.get('i.km-health-state.fa.fa-circle.green').should(Condition.HaveLength, 1).click();
    }

    static deleteProject(projectName: string): void {
      cy.get(`#km-delete-project-${projectName}`).should(Condition.NotBe, 'disabled').click();
      cy.get('#km-confirmation-dialog-input').type(projectName).should(Condition.HaveValue, projectName);
      cy.get('#km-confirmation-dialog-confirm-btn').click();
    }
    
    static addProjectBtn() {
        return cy.get('#km-add-project-top-btn');
    }
    
    static addDialogInput() {
        return cy.get('#km-add-project-dialog-input');
    }
    
    static addDialogSaveBtn() {
        return cy.get('#km-add-project-dialog-save');
    }

    static editProjectBtn(projectName: string) {
        return cy.get(`#km-edit-project-${projectName}`);
    }

    static editDialogInput() {
        return cy.get('#km-edit-project-dialog-input');
    }

    static editDialogConfirmBtn() {
        return cy.get('#km-edit-project-dialog-edit-btn');
    }

    static table() {
        return cy.get('tbody');
    }
}
