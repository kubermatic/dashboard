export class ProjectsPage {
    static visit() {
        cy.get('#km-nav-item-projects').click();
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
}
