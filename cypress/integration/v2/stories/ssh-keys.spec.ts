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

import {SSHKeysPage} from '../../../pages/ssh-keys.po';
import {Clusters} from '../../../pages/v2/clusters/proxy';
import {Pages} from '../../../pages/v2/pages';
import {Projects} from '../../../pages/v2/projects/page';
import {SSHKeys} from '../../../pages/v2/sshkeys/page';
import {Condition} from '../../../utils/condition';
import {BringYourOwn, Provider} from '../../../utils/provider';
import {View} from '../../../utils/view';

describe('SSH Key Management Story', () => {
  const projectName = Projects.getName();
  const clusterName = Clusters.getName();
  const sshKeyName = SSHKeys.getName();
  const publicKey = SSHKeys.publicKey;

  it('should login', () => {
    Pages.Root.login();
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should create a new project', () => {
    Pages.Projects.create(projectName);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
  });

  it('should select project', () => {
    Pages.Projects.select(projectName);
    Pages.expect(View.Clusters.Default);
  });

  it('should go to the ssh keys page', () => {
    Pages.SSHKeys.visit();
    Pages.expect(View.SSHKeys.Default);
  });

  it('should create the ssh key', () => {
    Pages.SSHKeys.create(sshKeyName, publicKey);
    Pages.SSHKeys.Buttons.tableRow(sshKeyName).should(Condition.Exist);
  });

  it('should go to the clusters page', () => {
    Pages.Clusters.List.visit();
    Pages.expect(View.Clusters.Default);
  });

  it('should create the cluster with ssh key', () => {
    Pages.Wizard.visit();
    Pages.Wizard.create(clusterName, Provider.kubeAdm, BringYourOwn.Frankfurt, sshKeyName);
    Pages.expect(View.Clusters.Default);
  });

  it('should remove the ssh key from the cluster', () => {
    Pages.Clusters.Details.Buttons.providerMenu.click();

    ClustersPage.getProviderMenuOption(ProviderMenuOption.ManageSSHKeys).click();
    ClustersPage.getSSHKeysTableRemoveButton(sshKeyName).click();
    ClustersPage.getDeleteDialogConfirmButton().click();
    ClustersPage.getDialogCloseButton().click();
  });

  it('should delete the ssh key', () => {
    SSHKeysPage.visit();
    SSHKeysPage.getDeleteSSHKeyButton(sshKeyName).click({force: true});
    SSHKeysPage.getDeleteSSHKeyConfirmationButton().click({force: true});
  });

  it('should verify that there are no projects', () => {
    SSHKeysPage.verifyNoSSHKeys();
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
