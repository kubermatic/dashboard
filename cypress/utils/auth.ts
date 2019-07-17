import {DexPage} from "../pages/dex.po";
import {LoginPage} from "../pages/login.po";
import {Condition} from "./condition";
import {wait} from "./wait";

export function login(email: string, password: string): void {
    LoginPage.visit();

    LoginPage.loginBtn().click();
    
    DexPage.loginWithEmailBtn().click();

    DexPage.loginInput().type(email).should(Condition.HaveValue, email);
    DexPage.passwordInput().type(password).should(Condition.HaveValue, password);
    DexPage.loginBtn().click();
    
    wait('**/projects');
}

export function logout(): void {
    LoginPage.logoutBtn().click();
}
