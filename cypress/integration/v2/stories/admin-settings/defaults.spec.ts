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

import {Intercept} from '@intercept';
import {Condition, Digitalocean, Provider, View} from '@kmtypes';
import {Preset, ProviderPreset} from '@kmtypes/preset';
import {Clusters, Pages, Projects} from '@pages/v2';

describe('Admin Settings - Defaults Story', () => {
  const projectName = Projects.getName();
  const clusterName = Clusters.getName();
  const preset = Preset.getName(ProviderPreset.Digitalocean);
  const initialMachineDeploymentName = Clusters.machineDeploymentName;
  const initialMachineDeploymentReplicas = '1';

  beforeEach(() => Intercept.init(Provider.Digitalocean));

  it('should login', () => {
    Pages.Root.login(undefined, undefined, true);
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it('should create a new project', () => {
    Pages.Projects.create(projectName);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'disabled').should(Condition.NotExist);
    Pages.Projects.Elements.projectItemIcon(projectName, 'running').should(Condition.Exist);
  });

  it('should go to the admin settings and check default values - defaults and limits page', () => {
    Pages.AdminSettings.visit();
    Pages.expect(View.AdminSettings.DefaultsAndLimits);

    Pages.AdminSettings.Defaults.Elements.enableClusterCleanupCheckboxInput.should(Condition.NotBeChecked);
    Pages.AdminSettings.Defaults.Elements.enforceClusterCleanupCheckboxInput.should(Condition.NotBeChecked);
  });

  it('should go to the admin settings and check default values - interface page', () => {
    Pages.AdminSettings.Interface.visit();
    Pages.expect(View.AdminSettings.Interface);

    Pages.AdminSettings.Interface.Elements.enableKubernetesDashboardCheckboxInput.should(Condition.BeChecked);
    Pages.AdminSettings.Interface.Elements.enableOIDCCheckboxInput.should(Condition.NotBeChecked);
    Pages.AdminSettings.Interface.Elements.enableExternalClustersCheckboxInput.should(Condition.BeChecked);
  });

  it('should go to projects view and select project', () => {
    Pages.Projects.open(projectName);
  });

  it('should make sure connect cluster button is visible', () => {
    Pages.Clusters.List.Buttons.externalClustersTab.should(Condition.Exist).click();
    Pages.Clusters.List.Buttons.addExternalCluster.should(Condition.Exist);
  });

  it('should go to wizard', () => {
    Pages.Clusters.List.Buttons.clustersTab.click();
    Pages.Wizard.visit();
  });

  it('should create a new cluster and wait for it to start', () => {
    Pages.Wizard.create(
      clusterName,
      Provider.Digitalocean,
      Digitalocean.Frankfurt,
      preset,
      initialMachineDeploymentName,
      initialMachineDeploymentReplicas
    );
    Pages.expect(View.Clusters.Default);
    Pages.Clusters.Details.Elements.machineDeploymentList.should(Condition.Contain, initialMachineDeploymentName);
  });

  it('should make sure default admin settings work', () => {
    // Cleanup settings check
    Pages.Clusters.Details.Buttons.deleteCluster.click();
    Pages.Clusters.Details.Elements.deleteDialogCleanupLBCheckboxInput.should(Condition.NotBeChecked);
    Pages.Clusters.Details.Elements.deleteDialogCleanupVolumeCheckboxInput.should(Condition.NotBeChecked);
    Pages.Clusters.Details.Buttons.deleteClusterClose.click();

    // Kubernetes Dashboard settings check
    Pages.Clusters.Details.Buttons.openKubernetesDashboard.should(Condition.Exist);

    // OIDC Kubeconfig settings check
    // Note: This is actually a workaround to simplify this check as it directly depends
    // on the OIDC kubeconfig setting. Make sure to have also `share_kubeconfig` set to true.
    Pages.Clusters.Details.Buttons.shareKubeconfig.should(Condition.Exist);
  });

  it('should go to the admin settings and update default values - defaults and limits page', () => {
    Pages.AdminSettings.visit();
    Pages.expect(View.AdminSettings.DefaultsAndLimits);

    Pages.AdminSettings.Defaults.selectClusterCleanup(true, true);

    Pages.AdminSettings.Defaults.Elements.enableClusterCleanupCheckboxInput.should(Condition.BeChecked);
    Pages.AdminSettings.Defaults.Elements.enforceClusterCleanupCheckboxInput.should(Condition.BeChecked);
  });

  it('should go to the admin settings and update default values - interface page', () => {
    Pages.AdminSettings.Interface.visit();
    Pages.expect(View.AdminSettings.Interface);

    Pages.AdminSettings.Interface.selectEnableKubernetesDashboard(false);
    Pages.AdminSettings.Interface.selectEnableOIDCKubeconfig(true);
    Pages.AdminSettings.Interface.selectEnableExternalClusterImport(false);

    Pages.AdminSettings.Interface.Elements.enableKubernetesDashboardCheckboxInput.should(Condition.NotBeChecked);
    Pages.AdminSettings.Interface.Elements.enableOIDCCheckboxInput.should(Condition.BeChecked);
    Pages.AdminSettings.Interface.Elements.enableExternalClustersCheckboxInput.should(Condition.NotBeChecked);
  });

  it('should go to clusters view and make sure external clusters are not available', () => {
    Pages.Projects.open(projectName);
    Pages.Clusters.List.Buttons.externalClustersTab.should(Condition.NotExist);
  });

  it('should go to cluster details page and make sure admin settings are reflected', () => {
    Pages.Clusters.List.select(clusterName);

    // Cleanup settings check
    Pages.Clusters.Details.Buttons.deleteCluster.click();
    Pages.Clusters.Details.Elements.deleteDialogCleanupLBCheckboxInput.should(Condition.BeChecked);
    Pages.Clusters.Details.Elements.deleteDialogCleanupLBCheckboxInput.should(Condition.BeDisabled);
    Pages.Clusters.Details.Elements.deleteDialogCleanupVolumeCheckboxInput.should(Condition.BeChecked);
    Pages.Clusters.Details.Elements.deleteDialogCleanupVolumeCheckboxInput.should(Condition.BeDisabled);
    Pages.Clusters.Details.Buttons.deleteClusterClose.click();

    // Kubernetes Dashboard settings check
    Pages.Clusters.Details.Buttons.openKubernetesDashboard.should(Condition.NotExist);

    // OIDC Kubeconfig settings check
    Pages.Clusters.Details.Buttons.shareKubeconfig.should(Condition.NotExist);
  });

  it('should delete created project and logout', () => {
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);

    Pages.Projects.Elements.projectItem(projectName).should(Condition.Exist);
    Pages.Projects.delete(projectName);
    Pages.Projects.Elements.projectItem(projectName).should(Condition.NotExist);

    Pages.Root.logout();
  });
});
