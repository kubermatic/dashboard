import {DexPage} from "../pages/dex.po";
import {LoginPage} from "../pages/login.po";
import {Condition} from "./condition";
import {ProjectsPage} from "../pages/projects.po";

export function login(email: string, password: string): void {
  LoginPage.visit();

  LoginPage.loginBtn().click();

  DexPage.loginWithEmailBtn().click();

  DexPage.loginInput().type(email).should(Condition.HaveValue, email);
  DexPage.passwordInput().type(password).should(Condition.HaveValue, password);
  DexPage.loginBtn().click();

  ProjectsPage.waitForRefresh();
}

export function logout(): void {
  LoginPage.logoutBtn().click();
}
