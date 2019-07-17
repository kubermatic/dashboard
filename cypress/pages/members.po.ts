import {Group} from "../utils/member";
import {wait} from "../utils/wait";
import {Condition} from "../utils/condition";

export class MembersPage {
    static visit(): void {
        cy.get('#km-nav-item-members').click();
        cy.url().should(Condition.Include, 'members');
        wait('**/users');
    }
    
    static addMemberBtn() {
        return cy.get('#km-add-member-top-btn');
    }
    
    static addMemberDialogEmailInput() {
        return cy.get('#km-add-member-dialog-email-input');
    }
    
    static addMemberDialogGroupCombobox() {
        return cy.get('#km-add-member-dialog-group-combobox');
    }
    
    static addMemberDialogSaveBtn() {
        return cy.get('#km-add-member-dialog-add-btn');
    }
    
    static memberDialogGroup(group: Group) {
        return cy.get('mat-option').contains('span', group);
    }
    
    static editMemberDialogGroupCombobox() {
        return cy.get('#km-edit-member-dialog-group-combobox');
    }
    
    static editBtn(email: string) {
        return MembersPage.tableRow(email).find('button i.km-icon-edit');
    }
    
    static deleteBtn(email: string) {
        return MembersPage.tableRow(email).find('button i.km-icon-delete');
    }
    
    static editMemberDialogSaveBtn() {
        return cy.get('#km-edit-member-dialog-edit-btn');
    }
    
    static table() {
        return cy.get('tbody');
    }
    
    static tableRow(email: string) {
        return MembersPage.tableRowEmailColumn(email).parent();
    }
    
    static tableRowEmailColumn(email: string) {
        return cy.get('td').contains(email);
    }
    
    static tableRowGroupColumn(email: string) {
        return MembersPage.tableRow(email).find('td.mat-column-group');
    }
    
    static deleteMemberDialogDeleteBtn() {
        return cy.get('#km-confirmation-dialog-confirm-btn');
    }
}
