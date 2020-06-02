import {DexPage} from '../pages/dex.po';
import {LoginPage} from '../pages/login.po';
import {Condition} from './condition';
import {ProjectsPage} from '../pages/projects.po';

export function login(email: string, password: string): void {
  LoginPage.visit();
  LoginPage.getLoginBtn().click();

  // The Dex created for e2e tests has only one connector (static passwords),
  // so there is no need to click on a "Log-in via e-Mail" button, as opposed to
  // dev/cloud.

  DexPage.getLoginInput().type(email).should(Condition.HaveValue, email);
  DexPage.getPasswordInput().type(password).should(Condition.HaveValue, password);
  DexPage.getLoginBtn().click();

  ProjectsPage.waitForRefresh();
}

export function logout(): void {
  LoginPage.getLogoutMenuBtn().click();
  LoginPage.getLogoutBtn().click();
}
