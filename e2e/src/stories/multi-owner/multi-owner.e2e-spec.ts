import {ProjectsPage} from "../../projects/projects.po";
import {LoginPage} from "../../login/login.po";
import {browser} from "protractor";
import {DexPage} from "../../dex/dex.po";
import {ConfirmationDialog} from "../../shared/confirmation.po";
import {KMElement} from "../../shared/element-utils";
import {MembersPage} from "../../member/member";
import {ClustersPage} from "../../clusters/clusters.po";

/**
 * This is the user story that tests basic kubermatic dashboard features such as:
 *  - login/logout
 *  - CRUD for projects, clusters, members
 *
 * It executes the following steps:
 *  - Login using static credentials as test user 'roxy'
 *  - Create new project called 'e2e-test-project'
 *  - Create new cluster callsed 'e2e-test-cluster' using kubeadm provider
 *  - Add new member
 *  - Edit group of added member
 *  - Delete created resources (member, cluster, project).
 *  - Logout from the application
 */

describe('Multi owner story', () => {
  const loginPage = new LoginPage();
  const projectsPage = new ProjectsPage();
  const clustersPage = new ClustersPage();
  const dexPage = new DexPage();
  const membersPage = new MembersPage();
  const confirmationDialog = new ConfirmationDialog();

  const projectNameMultiOwner = 'e2e-test-project-multi-owner';
  const memberEmail = browser.params.KUBERMATIC_E2E_USERNAME;
  const memberEmail2 = browser.params.KUBERMATIC_E2E_USERNAME_2;

  beforeAll(() => {
    loginPage.navigateTo();
    KMElement.waitToAppear(loginPage.getLoginButton());
  });

  it('should login', () => {
    loginPage.getLoginButton().click();
    dexPage.getLoginWithEmailButton().click();

    dexPage.getLoginInput().sendKeys(browser.params.KUBERMATIC_E2E_USERNAME);
    dexPage.getPasswordInput().sendKeys(browser.params.KUBERMATIC_E2E_PASSWORD);

    dexPage.getLoginSubmitButton().click();

    KMElement.waitToAppear(projectsPage.getLogoutButton());
    expect(projectsPage.getLogoutButton().isPresent()).toBeTruthy();
  });

  it('should create a new project for multiple owners', () => {
    KMElement.waitForNotifications();
    KMElement.waitToAppear(projectsPage.getAddProjectButton());
    projectsPage.getAddProjectButton().click();
    expect(projectsPage.getAddProjectDialog().isPresent()).toBeTruthy();

    projectsPage.getProjectNameInput().sendKeys(projectNameMultiOwner);
    projectsPage.getSaveProjectButton().click();

    KMElement.waitToDisappear(projectsPage.getAddProjectDialog());
    KMElement.waitForRedirect("/clusters");
    // We need to wait for autoredirect after create to finish otherwise it will autoredirect again after too fast page switch.
    browser.sleep(5000);
    projectsPage.navigateTo();
    KMElement.waitForRedirect("/projects");
    KMElement.waitToAppear(projectsPage.getProjectItem(projectNameMultiOwner));

    expect(projectsPage.getProjectItem(projectNameMultiOwner).isPresent()).toBeTruthy();
  });

  it('should add a new member as owner', () => {
    membersPage.navigateTo();
    KMElement.waitForNotifications();
    KMElement.waitForClickable(membersPage.getAddMemberBtn());

    membersPage.getAddMemberBtn().click();
    KMElement.waitToAppear(membersPage.getAddMemberDialog());

    KMElement.sendKeys(membersPage.getAddMemberDialogEmailInput(), memberEmail2);
    membersPage.getAddMemberDialogGroupCombobox().click();
    membersPage.getAddMemberDialogGroupOption(1).click();
    membersPage.getAddMemberDialogAddBtn().click();

    KMElement.waitToDisappear(membersPage.getAddMemberDialog());
    KMElement.waitToAppear(membersPage.getMemberItem(memberEmail2));
    expect(membersPage.getMemberItem(memberEmail2).isPresent()).toBeTruthy();
    expect(membersPage.getMemberGroup(memberEmail2).getText()).toEqual('Owner');
  });

  it('should logout', () => {
    KMElement.waitForNotifications();
    KMElement.waitToAppear(projectsPage.getLogoutButton());
    expect(projectsPage.getLogoutButton().isPresent()).toBeTruthy();

    projectsPage.getLogoutButton().click();

    KMElement.waitToAppear(loginPage.getLoginButton());
    expect(loginPage.getLoginButton().isPresent()).toBeTruthy();
  });

  it('should login with second user', () => {
    loginPage.getLoginButton().click();
    dexPage.getLoginWithEmailButton().click();

    dexPage.getLoginInput().sendKeys(browser.params.KUBERMATIC_E2E_USERNAME_2);
    dexPage.getPasswordInput().sendKeys(browser.params.KUBERMATIC_E2E_PASSWORD);

    dexPage.getLoginSubmitButton().click();

    KMElement.waitToAppear(projectsPage.getLogoutButton());
    expect(projectsPage.getLogoutButton().isPresent()).toBeTruthy();
  });

  it ('should automatically redirect to cluster page, because user has exact one project', () => {
    KMElement.waitForNotifications();
    KMElement.waitForClickable(clustersPage.getAddClusterTopBtn());
    expect(clustersPage.getAddClusterTopBtn().isPresent()).toBeTruthy();
  });

  it('should check if multi owner project is in list', () => {
    projectsPage.navigateTo();
    KMElement.waitForNotifications();
    KMElement.waitToAppear(projectsPage.getProjectItem(projectNameMultiOwner));
    expect(projectsPage.getProjectItem(projectNameMultiOwner).isPresent()).toBeTruthy();
  });

  it('should remove other owner from project', () => {
    membersPage.navigateTo();
    KMElement.waitForNotifications();
    KMElement.waitForClickable(membersPage.getMemberDeleteBtn(memberEmail));
    membersPage.getMemberDeleteBtn(memberEmail).click();

    KMElement.waitToAppear(confirmationDialog.getConfirmationDialog());
    confirmationDialog.getConfirmationDialogConfirmBtn().click();

    // Switch views to reload members list
    clustersPage.navigateTo();
    membersPage.navigateTo();

    expect(membersPage.getMemberItem(memberEmail).isPresent()).toBeFalsy();
  });

  it('should delete project', () => {
    projectsPage.navigateTo();
    KMElement.waitForNotifications();
    KMElement.waitToAppear(projectsPage.getDeleteProjectButton(projectNameMultiOwner));
    projectsPage.getDeleteProjectButton(projectNameMultiOwner).click();
    expect(confirmationDialog.getConfirmationDialog().isPresent()).toBeTruthy();

    KMElement.sendKeys(confirmationDialog.getConfirmationDialogInput(), projectNameMultiOwner);
    confirmationDialog.getConfirmationDialogConfirmBtn().click();

    KMElement.waitToDisappear(projectsPage.getProjectItem(projectNameMultiOwner));
    expect(projectsPage.getProjectItem(projectNameMultiOwner).isPresent()).toBeFalsy();
  });

  it('should logout with second user', () => {
    KMElement.waitForNotifications();
    KMElement.waitToAppear(projectsPage.getLogoutButton());
    expect(projectsPage.getLogoutButton().isPresent()).toBeTruthy();

    projectsPage.getLogoutButton().click();

    KMElement.waitToAppear(loginPage.getLoginButton());
    expect(loginPage.getLoginButton().isPresent()).toBeTruthy();
  });
});
