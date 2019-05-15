export class LoginPage {
    static visit() {
        cy.visit('/');
    }
    
    static loginBtn() {
        return cy.get('#login-button');
    }
    
    static logoutBtn() {
        return cy.get('#km-navbar-logout-btn');
    }
}
