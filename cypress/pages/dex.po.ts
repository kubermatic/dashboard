export class DexPage {
    static loginWithEmailBtn() {
        return cy.get('a').contains('Log in with Email');
    }
    
    static loginInput() {
        return cy.get('input#login');
    }
    
    static passwordInput() {
        return cy.get('input#password');
    }
    
    static loginBtn() {
        return cy.get('button#submit-login');
    }
}
