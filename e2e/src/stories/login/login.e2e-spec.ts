import {browser} from 'protractor';

import {DexPage} from '../../dex/dex.po';
import {LoginPage} from '../../login/login.po';
import {ProjectsPage} from '../../projects/projects.po';

describe('Login story', () => {
  const loginPage = new LoginPage();
  const dexPage = new DexPage();
  const projectsPage = new ProjectsPage();

  beforeAll(() => {
    loginPage.navigateTo();
    loginPage.waitForElement(loginPage.getLoginButton());
  });

  it('should click on login button', async () => {
    expect(loginPage.getLoginButton().isPresent()).toBeTruthy();
    await loginPage.getLoginButton().click();
  });

  it('should choose static credentials button', async () => {
    expect(dexPage.getStaticLoginButton().isPresent()).toBeTruthy();
    await dexPage.getStaticLoginButton().click();
  });

  it('should fill user credentials and login', async () => {
    expect(dexPage.getStaticLoginInput().isPresent()).toBeTruthy();
    await dexPage.getStaticLoginInput().sendKeys(browser.params.KUBERMATIC_E2E_USERNAME);

    expect(dexPage.getStaticPasswordInput().isPresent()).toBeTruthy();
    await dexPage.getStaticPasswordInput().sendKeys(browser.params.KUBERMATIC_E2E_PASSWORD);

    expect(dexPage.getStaticLoginSubmitButton().isPresent()).toBeTruthy();
    await dexPage.getStaticLoginSubmitButton().click();
  });

  it('should logout and get back to the login page', async () => {
    projectsPage.waitForElement(projectsPage.getLogoutButton());
    expect(projectsPage.getLogoutButton().isPresent()).toBeTruthy();

    await projectsPage.getLogoutButton().click();
    expect(loginPage.getLoginButton().isPresent()).toBeTruthy();
  });
});
