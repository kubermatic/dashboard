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

import {Provider} from './provider';

export enum Method {
  GET = 'GET',
  POST = 'POST',
}

// Registers standard set of interceptors for configuration like datacenters, seeds and settings. Interceptors can be
// modified later to simulate resource deletion or creation.
export function mockConfigEndpoints(): void {
  cy.intercept({method: Method.GET, path: '**/api/**/me'}, {fixture: 'me.json'}).as('getCurrentUser');
  cy.intercept({method: Method.GET, path: '**/api/**/seed'}, ['test-seed']).as('getSeeds');
  cy.intercept({method: Method.GET, path: '**/api/**/seeds/*/settings'}, {fixture: 'seed-settings.json'}).as(
    'getSeedSettings'
  );
  cy.intercept({method: Method.GET, path: '**/api/**/dc'}, {fixture: 'datacenters.json'}).as('getDatacenters');
  cy.intercept({method: Method.GET, path: '**/api/**/providers/*/presets*'}, {fixture: 'preset.json'}).as(
    'listPresets'
  );
  cy.intercept({method: Method.GET, path: '**/api/**/settings/customlinks'}, []).as('listCustomLinks');
  cy.intercept({method: Method.GET, path: '**/api/**/addons'}, []).as('listAddons');
  cy.intercept({method: Method.GET, path: '**/api/**/addonconfigs'}, []).as('listAddonConfigs');
  cy.intercept({method: Method.GET, path: '**/api/**/labels/system'}, {}).as('listSystemLabels');
}

// Registers standard set of interceptors for projects. Interceptors can be modified later to simulate resource
// deletion or creation.
export function mockProjectEndpoints(): void {
  const p = '**/api/**/projects'; // Common path for project related endpoints.
  cy.intercept({method: Method.POST, path: p}, {fixture: 'project.json'}).as('createProject');
  cy.intercept({method: Method.GET, path: `${p}*`}, {fixture: 'projects.json'}).as('listProjects');
  cy.intercept({method: Method.GET, path: `${p}/*`}, {fixture: 'project.json'}).as('getProject');
}

// Registers standard set of interceptors for clusters with chosen provider. Interceptors can be modified later
// to simulate resource deletion or creation.
export function mockClusterEndpoints(provider: Provider): void {
  const p = '**/api/**/projects/*/clusters'; // Common path for cluster related endpoints.
  cy.intercept({method: Method.POST, path: p}, {fixture: `${provider}/cluster.json`}).as('createCluster');
  cy.intercept({method: Method.GET, path: p}, {fixture: `${provider}/clusters.json`}).as('listClusters');
  cy.intercept({method: Method.GET, path: `${p}/*`}, {fixture: `${provider}/cluster.json`}).as('getCluster');
  cy.intercept({method: Method.GET, path: `${p}/*/health`}, {fixture: 'health.json'}).as('getHealth');
  cy.intercept({method: Method.GET, path: `${p}/*/metrics`}, []).as('listMetrics');
  cy.intercept({method: Method.GET, path: `${p}/*/machinedeployments`}, []).as('listMachineDeployments');
  cy.intercept({method: Method.GET, path: `${p}/*/nodes**`}, []).as('listNodes');
  cy.intercept({method: Method.GET, path: `${p}/*/events`}, []).as('listEvents');
  cy.intercept({method: Method.GET, path: `${p}/*/bindings`}, []).as('listBindings');
  cy.intercept({method: Method.GET, path: `${p}/*/clusterbindings`}, []).as('listClusterBindings');
  cy.intercept({method: Method.GET, path: `${p}/*/rulegroups`}, []).as('listRuleGroups');
  cy.intercept({method: Method.GET, path: `${p}/*/addons`}, []).as('listAddons');
  cy.intercept({method: Method.GET, path: `${p}/*/sshkeys`}, []).as('listSSHKeys');
  cy.intercept({method: Method.GET, path: `${p}/*/upgrades`}, []).as('listUpgrades');

  cy.intercept({method: Method.GET, path: '**/api/**/projects/*/kubernetes/clusters'}, []).as('listExternalClusters');
  cy.intercept({method: Method.GET, path: '**/projects/*/etcdrestores'}, []).as('listEtcdRestores');
  cy.intercept({method: Method.GET, path: '**/alertmanager/config'}, {}).as('getAlertmanagerConfig');
  cy.intercept({method: Method.GET, path: '**/providers/*/versions'}, {fixture: 'versions.json'}).as('listVersions');

  switch (provider) {
    case Provider.Alibaba:
      cy.intercept(
        {method: Method.GET, path: '**/api/**/alibaba/instancetypes'},
        {fixture: 'alibaba/instancetypes.json'}
      ).as('listAlibabaInstanceTypes');
      cy.intercept({method: Method.GET, path: '**/api/**/alibaba/vswitches'}, {fixture: 'alibaba/vswitches.json'}).as(
        'listAlibabaVSwitches'
      );
      cy.intercept({method: Method.GET, path: '**/api/**/alibaba/zones'}, {fixture: 'alibaba/zones.json'}).as(
        'listAlibabaZones'
      );
      break;
    case Provider.Anexia:
      cy.intercept({method: Method.GET, path: '**/api/**/anexia/vlans'}, {fixture: 'anexia/vlans.json'}).as(
        'listAnexiaVLANs'
      );
      cy.intercept({method: Method.GET, path: '**/api/**/anexia/templates'}, {fixture: 'anexia/templates.json'}).as(
        'listAnexiaTemplates'
      );
      break;
    case Provider.AWS:
      cy.intercept({method: Method.GET, path: '**/api/**/aws/*/subnets'}, {fixture: 'aws/subnets.json'}).as(
        'listAWSSubnets'
      );
      cy.intercept({method: Method.GET, path: '**/api/**/aws/sizes'}, {fixture: 'aws/sizes.json'}).as('listAWSSizes');
      break;
    case Provider.Azure:
      cy.intercept({method: Method.GET, path: '**/api/**/azure/sizes'}, {fixture: 'azure/sizes.json'}).as(
        'listAzureSizes'
      );
      break;
    case Provider.GCP:
      cy.intercept({method: Method.GET, path: '**/api/**/gcp/disktypes'}, {fixture: 'gcp/disktypes.json'}).as(
        'listGCPDiskTypes'
      );
      cy.intercept({method: Method.GET, path: '**/api/**/gcp/sizes'}, {fixture: 'gcp/sizes.json'}).as('listGCPSizes');
      cy.intercept({method: Method.GET, path: '**/api/**/gcp/*/zones'}, {fixture: 'gcp/zones.json'}).as('listGCPZones');
      break;
    case Provider.Equinix:
      cy.intercept({method: Method.GET, path: '**/api/**/packet/sizes'}, {fixture: 'packet/sizes.json'}).as(
        'listEquinixSizes'
      );
      break;
    case Provider.Hetzner:
      cy.intercept({method: Method.GET, path: '**/api/**/hetzner/sizes'}, {fixture: 'hetzner/sizes.json'}).as(
        'listHetznerSizes'
      );
      break;
    case Provider.KubeVirt:
      break;
    case Provider.OpenStack:
      cy.intercept({method: Method.GET, path: '**/api/**/openstack/sizes'}, {fixture: 'openstack/sizes.json'}).as(
        'listOpenStackSizes'
      );
      cy.intercept(
        {method: Method.GET, path: '**/api/**/openstack/availabilityzones'},
        {fixture: 'openstack/availabilityzones.json'}
      ).as('listOpenStackZones');
      break;
    case Provider.VSphere:
      break;
  }
}
