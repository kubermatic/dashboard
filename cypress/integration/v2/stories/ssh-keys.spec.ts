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

import {ProviderMenuOption} from '../../../pages/clusters.po';
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
    Pages.Clusters.Details.Buttons.providerMenuOption(ProviderMenuOption.ManageSSHKeys).click();
    Pages.Clusters.Details.Buttons.deleteSSHKey(sshKeyName).click();
    Pages.Clusters.Details.Buttons.deleteSSHKeyConfirm.click();
    Pages.Clusters.Details.Buttons.manageSSHKeyCloseButton.click();

    // TODO: add assertion
  });

  it('should delete the ssh key', () => {
    Pages.SSHKeys.visit();
    Pages.SSHKeys.Buttons.deleteSSHKey(sshKeyName).click();
    Pages.SSHKeys.Buttons.deleteSSHKeyConfirm.click();

    // TODO: add assertion
  });

  it('should go to the projects page', () => {
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should delete the project', () => {
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.delete(projectName);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.NotExist);
  });

  it('should logout', () => {
    Pages.Root.logout();
  });
});
