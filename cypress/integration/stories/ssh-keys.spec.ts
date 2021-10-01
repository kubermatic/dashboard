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

import {ClustersPage, ProviderMenuOption} from '../../pages/clusters.po';
import {ProjectsPage} from '../../pages/projects.po';
import {SSHKeysPage} from '../../pages/ssh-keys.po';
import {WizardPage} from '../../pages/wizard.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {Datacenter, Provider} from '../../utils/provider';
import {View} from '../../utils/view';
import {WizardStep} from '../../utils/wizard';
import * as _ from 'lodash';

describe('SSH Key Management Story', () => {
  const email = Cypress.env('KUBERMATIC_DEX_DEV_E2E_USERNAME');
  const password = Cypress.env('KUBERMATIC_DEX_DEV_E2E_PASSWORD');
  const projectName = _.uniqueId('e2e-test-project-');
  const clusterName = _.uniqueId('e2e-test-cluster-');
  const sshKeyName = 'test-ssh-key';
  const sshKeyPublic =
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCo/3xm3JmJ7rp7I6GNYvjySYlWIGe75Oyr/u2cv5Fv2vsqfsiAP2xvIrJKxQ3+LwZAo0JnTvNQ' +
    'bVKo+G6pV1HEXhRlPuLuKWtkKCJue0wJXnIUz3dSniQDSIovjM+j5FUQauE3KeVgII2SQ7vVIKJcpFNVoA6cUjCeV8S9IHndOERzbBMhFe2sI3Ej' +
    'HSYSw2PCyXrUvDWBFjeUEV9jr3TJHLs7ea0bXJj+SA5o4nw/XOCqnoJsnBZa+I3KIAiHgV779R3XGlWZ1aD0ow4y3UzXy2U+aKKPBEoXFmKAKezt' +
    'vopqZemjIGzQT8Bgu1inXcwMfo3sB5bYMDnnP3Wyn/gz';

  it('should login', () => {
    login(email, password);
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it('should create a new project', () => {
    ProjectsPage.addProject(projectName);
  });

  it('should select project', () => {
    ProjectsPage.selectProject(projectName);
  });

  it('should go to the ssh keys page', () => {
    SSHKeysPage.visit();
  });

  it('should create the ssh key', () => {
    SSHKeysPage.getAddSSHKeyButton().click();
    SSHKeysPage.getAddSSHKeyNameInput().type(sshKeyName);
    SSHKeysPage.getAddSSHKeyTextarea()
      .click()
      .then($element => {
        $element.text(sshKeyPublic);
        $element.val(sshKeyPublic);
        cy.get($element).type(' {backspace}');
      });
    SSHKeysPage.getAddSSHKeySaveButton().click();

    SSHKeysPage.getTable().should(Condition.Contain, sshKeyName);
  });

  it('should create the cluster with ssh key', () => {
    ClustersPage.visit();
    ClustersPage.openWizard();
    WizardPage.getProviderBtn(Provider.BringYourOwn).click();
    WizardPage.getDatacenterBtn(Datacenter.BringYourOwn.Frankfurt).click();
    WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
    WizardPage.getSSHKeysSelect().click();
    WizardPage.getSSHKeysSelectOption(sshKeyName).click();
    WizardPage.getOverlayContainer().click();
    WizardPage.getNextBtn(WizardStep.Cluster).click();
    WizardPage.getCreateBtn().click({force: true});

    ClustersPage.verifyUrl();
  });

  it('should remove the ssh key from the cluster', () => {
    ClustersPage.getProviderMenuButton().click();
    ClustersPage.getProviderMenuOption(ProviderMenuOption.ManageSSHKeys).click();
    ClustersPage.getSSHKeysTableRemoveButton(sshKeyName).click();
    ClustersPage.getDeleteDialogConfirmButton().click();
  });

  it('should re-add the ssh key to the cluster', () => {
    ClustersPage.getSSHKeysAddDropdown().click();
    ClustersPage.getSSHKeysDropdownOption(sshKeyName).click();
    ClustersPage.getSSHKeysTableRow(sshKeyName).should(Condition.Exist);
    ClustersPage.getDialogCloseButton().click();
  });

  it('should delete the ssh key', () => {
    SSHKeysPage.visit();
    SSHKeysPage.getDeleteSSHKeyButton(sshKeyName).click();
    SSHKeysPage.getDeleteSSHKeyConfirmationButton().click();

    SSHKeysPage.getTable().should(Condition.NotContain, sshKeyName);
  });

  it('should go to the projects page', () => {
    ProjectsPage.visit();
  });

  it('should delete the project', () => {
    ProjectsPage.deleteProject(projectName);
    ProjectsPage.verifyNoProjects();
  });

  it('should logout', () => {
    logout();
  });
});
