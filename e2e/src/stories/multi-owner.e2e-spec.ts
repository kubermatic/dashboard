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

  it('should login as a first owner', async () => {
    await AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should create a test project', async () => {
    await ProjectUtils.createProject(projectNameMultiOwner);
  });
  
  it('should add a new member to project', async () => {
    await membersPage.navigateTo();

    await KMElement.click(membersPage.getAddMemberBtn());

    await KMElement.waitToAppear(membersPage.getAddMemberDialog());
    await KMElement.waitToAppear(membersPage.getAddMemberDialogEmailInput());
    await KMElement.fill(membersPage.getAddMemberDialogEmailInput(), memberEmail2);

    await KMElement.click(membersPage.getAddMemberDialogGroupCombobox());
    await KMElement.click(membersPage.getAddMemberDialogGroupOption(1));
    await KMElement.click(membersPage.getAddMemberDialogAddBtn());
    await KMElement.waitToDisappear(membersPage.getAddMemberDialog());

    await KMElement.waitToAppear(membersPage.getMemberItem(memberEmail2), 300000);
    expect(membersPage.getMemberItem(memberEmail2).isPresent()).toBeTruthy();
  });

  it('should login as a second owner', async () => {
    await AuthUtils.logout();
    await AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME_2, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should check if multi owner project is in list', async () => {
    await projectsPage.navigateTo();
    await KMElement.waitToAppear(projectsPage.getProjectItem(projectNameMultiOwner));
    expect(projectsPage.getProjectItem(projectNameMultiOwner).isPresent()).toBeTruthy();
  });

  it('should delete other owner from the project', async () => {
    await membersPage.navigateTo();
    await KMElement.click(membersPage.getMemberDeleteBtn(memberEmail));

    await KMElement.waitToAppear(confirmationDialog.getConfirmationDialog());
    await KMElement.click(confirmationDialog.getConfirmationDialogConfirmBtn());
    await KMElement.waitToDisappear(confirmationDialog.getConfirmationDialog());

    // Switch views to reload members list
    await clustersPage.navigateTo();
    await membersPage.navigateTo();

    expect(await membersPage.getMemberItem(memberEmail).isPresent()).toBeFalsy();
  });

  it('should delete created project', async () => {
    await ProjectUtils.deleteProject(projectNameMultiOwner);
  });

  it('should logout', async () => {
    await AuthUtils.logout();
  });
});
