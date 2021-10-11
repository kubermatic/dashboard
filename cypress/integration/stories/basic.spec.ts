// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ClustersPage} from '../../pages/clusters.po';
import {MembersPage} from '../../pages/members.po';
import {ProjectsPage} from '../../pages/projects.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Group, reloadUsers} from '../../utils/member';
import {Datacenter, Provider} from '../../utils/provider';
import {View} from '../../utils/view';
import {WizardStep} from '../../utils/wizard';
import * as _ from 'lodash';

describe('Basic Story', () => {
  const newUserEmail = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME_2');
  let projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');

  it('should login', () => {
    login();
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to wizard', () => {
    ClustersPage.openWizard();
  });

  it('should create a new cluster', () => {
    WizardPage.getProviderBtn(Provider.BringYourOwn).click();
    WizardPage.getDatacenterBtn(Datacenter.BringYourOwn.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
    WizardPage.getCreateBtn().click({force: true});

    ClustersPage.verifyUrl();
  });

  it('should go to members view', () => {
    MembersPage.visit();
  });

  it('should add a new member', () => {
    MembersPage.addMember(newUserEmail, Group.Editor);
  });

  it('should edit created member info', () => {
    reloadUsers();
    MembersPage.editMember(newUserEmail, Group.Viewer);
    reloadUsers();
    MembersPage.getTableRowGroupColumn(newUserEmail).should(Condition.Contain, Group.Viewer);
  });

  it('should delete created member', () => {
    reloadUsers();
    MembersPage.getDeleteBtn(newUserEmail).click();
    MembersPage.getDeleteMemberDialogDeleteBtn().click();
    reloadUsers();
    MembersPage.getTableRowEmailColumn(newUserEmail).should(Condition.NotExist);
  });

  it('should delete created cluster', () => {
    ClustersPage.visit();
    ClustersPage.getClusterItem(clusterName).click();
    ClustersPage.deleteCluster(clusterName);
  });

  it('should verify that there are no clusters', () => {
    ClustersPage.verifyNoClusters();
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should edit created project name', () => {
    ProjectsPage.getEditProjectBtn(projectName).click();

    projectName = `${projectName}-edited`;
    ProjectsPage.getEditDialogInput().type('-edited').should(Condition.HaveValue, projectName);
    ProjectsPage.getEditDialogConfirmBtn().click();

    ProjectsPage.waitForRefresh();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
