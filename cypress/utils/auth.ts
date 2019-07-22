import {DexPage} from "../pages/dex.po";
import {LoginPage} from "../pages/login.po";
import {Condition} from "./condition";
import {ProjectsPage} from "../pages/projects.po";

export function login(email: string, password: string): void {
  LoginPage.visit();

  LoginPage.getLoginBtn().click();

  DexPage.getLoginWithEmailBtn().click();

  DexPage.getLoginInput().type(email).should(Condition.HaveValue, email);
  DexPage.getPasswordInput().type(password).should(Condition.HaveValue, password);
  DexPage.getLoginBtn().click();

  ProjectsPage.waitForRefresh();
}

export function logout(): void {
  LoginPage.getLogoutMenuBtn().click();
  LoginPage.getLogoutBtn().click();
}
