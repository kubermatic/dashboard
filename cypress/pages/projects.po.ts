export class ProjectsPage {
    static visit() {
        cy.get('#km-nav-item-projects').click();
    }

    static select(projectName: string) {
      cy.get(`#km-project-name-${projectName}`)
        .parent()
        .find('td.mat-column-status')
        .find('i.km-health-state.fa.fa-circle.green')
        .click();
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
    
    static deleteProjectBtn(projectName: string) {
        return cy.get(`#km-delete-project-${projectName}`);
    }
    
    static deleteDialogInput() {
        return cy.get('#km-confirmation-dialog-input');
    }
    
    static deleteDialogConfirmBtn() {
        return cy.get('#km-confirmation-dialog-confirm-btn');
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
}
