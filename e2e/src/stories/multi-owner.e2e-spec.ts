import {browser} from 'protractor';

import {ClustersPage} from '../pages/clusters/clusters.po';
import {MembersPage} from '../pages/member/member';
import {ProjectsPage} from '../pages/projects/projects.po';
import {ConfirmationDialog} from '../pages/shared/confirmation.po';
import {AuthUtils} from '../utils/auth';
import {KMElement} from '../utils/element';
import {ProjectUtils} from '../utils/project';
import {RandomUtils} from "../utils/random";

describe('Multi Owner story', () => {
  const projectsPage = new ProjectsPage();
  const clustersPage = new ClustersPage();
  const membersPage = new MembersPage();
  const confirmationDialog = new ConfirmationDialog();

  const projectNameMultiOwner = RandomUtils.prefixedString('e2e-test-project-multi-owner');
  const memberEmail = browser.params.KUBERMATIC_E2E_USERNAME;
  const memberEmail2 = browser.params.KUBERMATIC_E2E_USERNAME_2;

  it('should login as a second user and logout', () => {
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME_2, browser.params.KUBERMATIC_E2E_PASSWORD);
    AuthUtils.logout();
  });

  it('should login as a first user', () => {
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should create a test project', () => {
    ProjectUtils.createProject(projectNameMultiOwner);
  });
  
  it('should add a new member to project', () => {
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

  it('should login as a second owner', () => {
    AuthUtils.logout();
    AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME_2, browser.params.KUBERMATIC_E2E_PASSWORD);
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
