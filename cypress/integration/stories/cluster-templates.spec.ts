// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import _ from 'lodash';
import {ClusterTemplatesPage} from '../../pages/cluster-templates.po';
import {ClustersPage} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Mocks} from '../../utils/mocks';
import {Datacenter, Provider} from '../../utils/provider';
import {View} from '../../utils/view';
import {WizardStep} from '../../utils/wizard';

describe('Cluster Templates Story', () => {
  const projectName = Mocks.enabled() ? 'test-project' : _.uniqueId('test-project-');
  const clusterName = Mocks.enabled() ? 'test-cluster' : _.uniqueId('test-cluster-');
  const templateName = Mocks.enabled() ? 'test-template' : _.uniqueId('test-template-');
  const templateInstances = 1;

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register(Provider.kubeAdm);
    }
  });

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

  it('should fill the wizard', () => {
    WizardPage.getProviderBtn(Provider.kubeAdm).click();
    WizardPage.getDatacenterBtn(Datacenter.BringYourOwn.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getNextBtn(WizardStep.Cluster).click({force: true});
  });

  it('should save the cluster template', () => {
    WizardPage.getCreateTemplateBtn().click({force: true});
    WizardPage.getCreateTemplateNameInput().type(templateName).should(Condition.HaveValue, templateName);
    WizardPage.getCreateTemplateConfirmBtn().click({force: true});
  });

  it('should go to the cluster templates page', () => {
    ClusterTemplatesPage.visit();
  });

  it('should create instance from the template', () => {
    ClusterTemplatesPage.getTemplateInstanceBtn(templateName).click({force: true});
    ClusterTemplatesPage.getCreateTemplateInstanceBtn().click({force: true});
  });

  it('should verify redirect to clusters page', () => {
    ClustersPage.waitForRefresh();
    ClustersPage.verifyUrl();
  });

  it('should verify if instance was created', () => {
    ClustersPage.verifyClustersCount(templateInstances);
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
  });

  it('should verify that there are no projects', () => {
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
