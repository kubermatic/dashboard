import {ProjectsPage} from "../../projects/projects.po";
import {LoginPage} from "../../login/login.po";
import {browser} from "protractor";
import {DexPage} from "../../dex/dex.po";

describe('Projects story', () => {
  const loginPage = new LoginPage();
  const projectsPage = new ProjectsPage();
  const dexPage = new DexPage();

  const projectName = 'e2e-test-project';

  beforeAll(() => {
    loginPage.navigateTo();
    loginPage.waitForElement(loginPage.getLoginButton());
  });

  it('should login', async () => {
    await loginPage.getLoginButton().click();
    await dexPage.getStaticLoginButton().click();

    await dexPage.getStaticLoginInput().sendKeys(browser.params.KUBERMATIC_E2E_USERNAME);
    await dexPage.getStaticPasswordInput().sendKeys(browser.params.KUBERMATIC_E2E_PASSWORD);

    await dexPage.getStaticLoginSubmitButton().click();

    projectsPage.waitForElement(projectsPage.getLogoutButton());
    expect(projectsPage.getLogoutButton().isPresent()).toBeTruthy();
  });

  it('should create a new project', async () => {
    await projectsPage.navigateTo();
    projectsPage.waitForElement(projectsPage.getAddProjectButton());

    await projectsPage.getAddProjectButton().click();
    expect(projectsPage.getAddProjectDialog().isPresent()).toBeTruthy();

    await projectsPage.getProjectNameInput().sendKeys(projectName);
    await projectsPage.getSaveProjectButton().click();

    projectsPage.waitToDisappear(projectsPage.getAddProjectDialog());
    await projectsPage.navigateTo();
    projectsPage.waitForElement(projectsPage.getProjectItem(projectName));

    expect(projectsPage.getProjectItem(projectName).isPresent()).toBeTruthy();
  });

  it('should delete created project', async () => {
    projectsPage.waitForElement(projectsPage.getDeleteProjectButton(projectName));
    await projectsPage.getDeleteProjectButton(projectName).click();
    expect(projectsPage.getDeleteProjectDialog().isPresent()).toBeTruthy();

    await projectsPage.getDeleteProjectDialogInput().sendKeys(projectName);
    await projectsPage.getDeleteProjectDialogButton().click();

    projectsPage.waitToDisappear(projectsPage.getProjectItem(projectName));
    expect(projectsPage.getProjectItem(projectName).isPresent()).toBeFalsy();
  });

  it('should logout', async () => {

  });
});
