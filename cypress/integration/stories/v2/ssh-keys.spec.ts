// // Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //     http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.
//
// describe('SSH Key Management Story', () => {
//   const projectName = Projects.getName();
//   const clusterName = Mocks.enabled() ? 'test-cluster' : _.uniqueId('test-cluster-');
//   const sshKeyName = 'test-ssh-key';
//   const sshKeyPublic =
//     'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCo/3xm3JmJ7rp7I6GNYvjySYlWIGe75Oyr/u2cv5Fv2vsqfsiAP2xvIrJKxQ3+LwZAo0JnTvNQ' +
//     'bVKo+G6pV1HEXhRlPuLuKWtkKCJue0wJXnIUz3dSniQDSIovjM+j5FUQauE3KeVgII2SQ7vVIKJcpFNVoA6cUjCeV8S9IHndOERzbBMhFe2sI3Ej' +
//     'HSYSw2PCyXrUvDWBFjeUEV9jr3TJHLs7ea0bXJj+SA5o4nw/XOCqnoJsnBZa+I3KIAiHgV779R3XGlWZ1aD0ow4y3UzXy2U+aKKPBEoXFmKAKezt' +
//     'vopqZemjIGzQT8Bgu1inXcwMfo3sB5bYMDnnP3Wyn/gz';
//
//   it('should login', () => {
//     Pages.Root.login();
//     Pages.Projects.visit();
//     Pages.expect(View.Projects.Default);
//   });
//
//   it('should create a new project', () => {
//     Pages.Projects.create(projectName);
//     Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
//   });
//
//   it('should select project', () => {
//     Pages.Projects.select(projectName);
//     Pages.expect(View.Clusters.Default);
//   });
//
//   it('should go to the ssh keys page', () => {
//     SSHKeysPage.visit();
//   });
//
//   it('should create the ssh key', () => {
//     SSHKeysPage.getAddSSHKeyButton().click();
//     SSHKeysPage.getAddSSHKeyNameInput().type(sshKeyName);
//     SSHKeysPage.getAddSSHKeyTextarea()
//       .click()
//       .then($element => {
//         $element.text(sshKeyPublic);
//         $element.val(sshKeyPublic);
//         cy.get($element).type(' {backspace}');
//       });
//     SSHKeysPage.getAddSSHKeySaveButton().click();
//
//     SSHKeysPage.getTable().should(Condition.Contain, sshKeyName);
//   });
//
//   it('should create the cluster with ssh key', () => {
//     ClustersPage.visit();
//     ClustersPage.openWizard();
//     WizardPage.getProviderBtn(Provider.kubeAdm).click();
//     WizardPage.getDatacenterBtn(Datacenter.BringYourOwn.Frankfurt).click();
//     WizardPage.getClusterNameInput().type(clusterName).should(Condition.HaveValue, clusterName);
//     WizardPage.getSSHKeysSelect().click();
//     WizardPage.getSSHKeysSelectOption(sshKeyName).click();
//     WizardPage.getOverlayContainer().click();
//     WizardPage.getNextBtn(WizardStep.Cluster).click();
//     WizardPage.getCreateBtn().click({force: true});
//
//     ClustersPage.verifyUrl();
//   });
//
//   it('should remove the ssh key from the cluster', () => {
//     ClustersPage.getProviderMenuButton().click();
//     ClustersPage.getProviderMenuOption(ProviderMenuOption.ManageSSHKeys).click();
//     ClustersPage.getSSHKeysTableRemoveButton(sshKeyName).click();
//     ClustersPage.getDeleteDialogConfirmButton().click();
//     ClustersPage.getDialogCloseButton().click();
//   });
//
//   it('should delete the ssh key', () => {
//     SSHKeysPage.visit();
//     SSHKeysPage.getDeleteSSHKeyButton(sshKeyName).click({force: true});
//     SSHKeysPage.getDeleteSSHKeyConfirmationButton().click({force: true});
//   });
//
//   it('should verify that there are no projects', () => {
//     SSHKeysPage.verifyNoSSHKeys();
//   });
//
//   it('should go to the projects page', () => {
//     ProjectsPage.visit();
//   });
//
//   it('should delete the project', () => {
//     ProjectsPage.deleteProject(projectName);
//   });
//
//   it('should verify that there are no projects', () => {
//     ProjectsPage.verifyNoProjects();
//   });
//
//   it('should logout', () => {
//     logout();
//   });
// });
