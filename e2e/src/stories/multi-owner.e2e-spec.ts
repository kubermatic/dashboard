import {browser} from 'protractor';

import {ClustersPage} from '../pages/clusters/clusters.po';
import {MembersPage} from '../pages/member/member';
import {ProjectsPage} from '../pages/projects/projects.po';
import {AuthUtils} from '../utils/auth';
import {KMElement} from '../utils/element';
import {ProjectUtils} from '../utils/project';
import {RandomUtils} from "../utils/random";
import {ConfirmationUtils} from '../utils/confirmation';
import {minute} from '../utils/constants';

describe('Multi Owner story', () => {
  const projectsPage = new ProjectsPage();
  const clustersPage = new ClustersPage();
  const membersPage = new MembersPage();

  const projectName = RandomUtils.prefixedString('e2e-test-project');
  const memberEmail = browser.params.KUBERMATIC_E2E_USERNAME;
  const memberEmail2 = browser.params.KUBERMATIC_E2E_USERNAME_2;

  it('should login as a first owner', async () => {
    await AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should create a test project', async () => {
    await ProjectUtils.createProject(projectName);
  });

  it('should select the new project', async () => {
    await ProjectUtils.selectProject(projectName);
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

    await KMElement.waitToAppear(membersPage.getMemberItem(memberEmail2),5 * minute);
    expect(await membersPage.getMemberItem(memberEmail2).isDisplayed()).toBeTruthy();
  });

  it('should logout', async () => {
    await AuthUtils.logout();
  });

  it('should login as a second owner', async () => {
    await AuthUtils.login(browser.params.KUBERMATIC_E2E_USERNAME_2, browser.params.KUBERMATIC_E2E_PASSWORD);
  });

  it('should check if multi owner project is in list', async () => {
    await KMElement.waitToAppear(projectsPage.getProjectItem(projectName));
    expect(await projectsPage.getProjectItem(projectName).isDisplayed()).toBeTruthy();
  });

  it('should open multi owner project', async () => {
    await ProjectUtils.selectProject(projectName);
  });

  it('should delete other owner from the project', async () => {
    await membersPage.navigateTo();

    await KMElement.click(membersPage.getMemberDeleteBtn(memberEmail));

    await ConfirmationUtils.confirm();

    // Switch views to reload members list
    await clustersPage.navigateTo();
    await membersPage.navigateTo();

    expect(await browser.isElementPresent(membersPage.getMemberItem(memberEmail))).toBeFalsy();
  });

  it('should delete created project', async () => {
    await ProjectUtils.goBackToProjects();

    await ProjectUtils.deleteProject(projectName);
  });

  it('should logout', async () => {
    await AuthUtils.logout();
  });
});
