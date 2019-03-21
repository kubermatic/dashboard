import {browser} from 'protractor';

import {ClustersPage} from '../pages/clusters/clusters.po';
import {MembersPage} from '../pages/member/member';
import {ProjectsPage} from '../pages/projects/projects.po';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';
import {AuthUtils} from '../utils/auth';
import {KMElement} from '../utils/element';
import {ProjectUtils} from '../utils/project';

describe('Multi Owner story', () => {
  const projectsPage = new ProjectsPage();
  const clustersPage = new ClustersPage();
  const membersPage = new MembersPage();
  const confirmationDialog = new ConfirmationDialog();

  const projectNameMultiOwner = 'e2e-test-project-multi-owner';
  const memberEmail = browser.params.KUBERMATIC_E2E_USERNAME;
  const memberEmail2 = browser.params.KUBERMATIC_E2E_USERNAME_2;

  beforeAll(() => {
    // login with second user, to register him in dex
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME_2, browser.params.KUBERMATIC_E2E_PASSWORD);
    AuthUtils.logout();
    // login with first user to create project for multiple owners
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
    ProjectUtils.createProject(projectNameMultiOwner);
  });
  
  it('should add a new member to project', () => {
    browser.sleep(60000);
    membersPage.navigateTo();

    KMElement.waitForClickable(membersPage.getAddMemberBtn());
    membersPage.getAddMemberBtn().click();
    KMElement.waitToAppear(membersPage.getAddMemberDialog());

    KMElement.waitToAppear(membersPage.getAddMemberDialogEmailInput());
    KMElement.sendKeys(membersPage.getAddMemberDialogEmailInput(), memberEmail2);
    KMElement.waitToAppear(membersPage.getAddMemberDialogGroupCombobox());
    membersPage.getAddMemberDialogGroupCombobox().click();
    membersPage.getAddMemberDialogGroupOption(1).click();
    membersPage.getAddMemberDialogAddBtn().click();

    KMElement.waitToDisappear(membersPage.getAddMemberDialog());
    KMElement.waitToAppear(membersPage.getMemberItem(memberEmail2), 300000);
    expect(membersPage.getMemberItem(memberEmail2).isPresent()).toBeTruthy();
  });

  it('should logout with first user', () => {
    AuthUtils.logout();
  });

  it('should login with second owner', () => {
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME_2, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it ('should automatically redirect to cluster page, because user has exact one project', () => {
    KMElement.waitForClickable(clustersPage.getAddClusterTopBtn());
    expect(clustersPage.getAddClusterTopBtn().isPresent()).toBeTruthy();
  });

  it('should check if multi owner project is in list', () => {
    projectsPage.navigateTo();
    KMElement.waitToAppear(projectsPage.getProjectItem(projectNameMultiOwner));
    expect(projectsPage.getProjectItem(projectNameMultiOwner).isPresent()).toBeTruthy();
  });

  it('should delete other owner from project', () => {
    membersPage.navigateTo();
    KMElement.waitToAppear(membersPage.getMemberDeleteBtn(memberEmail));
    membersPage.getMemberDeleteBtn(memberEmail).click();

    KMElement.waitToAppear(confirmationDialog.getConfirmationDialog());
    KMElement.waitToAppear(confirmationDialog.getConfirmationDialogConfirmBtn());
    confirmationDialog.getConfirmationDialogConfirmBtn().click();
    KMElement.waitToDisappear(confirmationDialog.getConfirmationDialog());

    // Switch views to reload members list
    clustersPage.navigateTo();
    membersPage.navigateTo();

    expect(membersPage.getMemberItem(memberEmail).isPresent()).toBeFalsy();
  });

  it('should delete created project', () => {
    projectsPage.navigateTo();
    ProjectUtils.deleteProject(projectNameMultiOwner);
  });

  it('should logout', () => {
    AuthUtils.logout();
  });
});
