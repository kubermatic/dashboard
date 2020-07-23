import {DexPage} from '../pages/dex.po';
import {LoginPage} from '../pages/login.po';
import {Condition} from './condition';
import {ProjectsPage} from '../pages/projects.po';
import {UserPanel} from '../pages/user-panel.po';

export function login(email: string, password: string): void {
  LoginPage.visit();
  LoginPage.getLoginBtn().click();

  // Conditionally click on the login with email btn if it exists
  DexPage.getLoginPanel().then(element => {
    if (DexPage.hasLoginWithEmailBtn(element)) {
      DexPage.getLoginWithEmailBtn().click();
    }
  });

  DexPage.getLoginInput().type(email).should(Condition.HaveValue, email);
  DexPage.getPasswordInput().type(password).should(Condition.HaveValue, password);
  DexPage.getLoginBtn().click();

  ProjectsPage.waitForRefresh();
}

export function logout(): void {
  UserPanel.logout();
}
