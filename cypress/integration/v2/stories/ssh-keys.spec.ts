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

import {BringYourOwn} from '@ctypes/datacenter';
import {Clusters} from '../../../pages/v2/clusters/proxy';
import {Pages} from '../../../pages/v2/pages';
import {Projects} from '../../../pages/v2/projects/page';
import {SSHKeys} from '../../../pages/v2/sshkeys/page';
import {Provider} from '@ctypes/provider';
import {Condition} from '../../../utils/condition';
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
    Pages.Wizard.create(clusterName, Provider.kubeadm, BringYourOwn.Frankfurt, sshKeyName);
    Pages.expect(View.Clusters.Default);
    Pages.Clusters.Details.Elements.sshKeys(sshKeyName).should(Condition.Exist);
  });

  it('should remove the ssh key from the cluster', () => {
    Pages.Clusters.Details.removeSSHKey(sshKeyName, Provider.kubeadm);
    Pages.Clusters.Details.Elements.sshKeys().should(Condition.Exist);
  });

  it('should delete the cluster', () => {
    Pages.Clusters.Details.delete(clusterName, Provider.kubeadm);
    Pages.Root.Elements.spinner.should(Condition.NotExist);
    Pages.Clusters.List.Elements.clusterItem(clusterName).should(Condition.NotExist);
  });

  it('should delete the ssh key', () => {
    Pages.SSHKeys.visit();
    Pages.SSHKeys.delete(sshKeyName);
    Pages.SSHKeys.Elements.sshKey(sshKeyName).should(Condition.NotExist);
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
