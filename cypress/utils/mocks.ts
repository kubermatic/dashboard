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
import {RouteHandler} from 'cypress/types/net-stubbing';
import {Endpoint} from './endpoint';

// Registers standard set of interceptors for configuration like datacenters, seeds and settings. Interceptors can be
// modified later to simulate resource deletion or creation.
export function mockConfigEndpoints(): void {
  cy.intercept({method: Method.GET, path: '**/api/**/dc'}, {fixture: 'datacenters.json'});
  cy.intercept({method: Method.GET, path: '**/api/**/providers/*/presets*'}, {fixture: 'preset.json'})
  cy.intercept({method: Method.GET, path: '**/api/**/settings/customlinks'}, []);
  cy.intercept({method: Method.GET, path: '**/api/**/addons'}, []);
  cy.intercept({method: Method.GET, path: '**/api/**/addonconfigs'}, []);
  cy.intercept({method: Method.GET, path: '**/api/**/labels/system'}, {});
}

// Registers standard set of interceptors for clusters with chosen provider. Interceptors can be modified later
// to simulate resource deletion or creation.
export function mockClusterEndpoints(provider: Provider): void {
  const p = '**/api/**/projects/*/clusters'; // Common path for cluster related endpoints.
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

  Mocks.register(provider);
}

enum Method {
  GET = 'GET',
  POST = 'POST',
}

interface Mock {
  m: Method;
  p: string;
  r: RouteHandler;
}

export class Mocks {
  // TODO: Add namespace for fixtures like it is done for endpoints.
  private static _common: Mock[] = [
    {m: Method.GET, p: '**/api/**/me', r: {fixture: 'me.json'}},
    {m: Method.GET, p: '**/api/**/seed', r: ['test-seed']},
    {m: Method.GET, p: '**/api/**/seeds/*/settings', r: {fixture: 'seed-settings.json'}},

    {m: Method.POST, p: '**/api/**/projects', r: {fixture: 'project.json'}},
    {m: Method.GET, p: '**/api/**/projects*', r: {fixture: 'projects.json'}},
    {m: Method.GET, p: '**/api/**/projects/*', r: {fixture: 'project.json'}},

    {m: Method.GET, p: Endpoint.Alibaba.InstanceTypes, r: {fixture: 'alibaba/instancetypes.json'}},
    {m: Method.GET, p: Endpoint.Alibaba.VSwitches, r: {fixture: 'alibaba/vswitches.json'}},
    {m: Method.GET, p: Endpoint.Alibaba.Zones, r: {fixture: 'alibaba/zones.json'}},
    {m: Method.GET, p: Endpoint.Anexia.Templates, r: {fixture: 'anexia/templates.json'}},
    {m: Method.GET, p: Endpoint.Anexia.VLANs, r: {fixture: 'anexia/vlans.json'}},
    {m: Method.GET, p: Endpoint.AWS.Sizes, r: {fixture: 'aws/sizes.json'}},
    {m: Method.GET, p: Endpoint.AWS.Subnets, r: {fixture: 'aws/subnets.json'}},
    {m: Method.GET, p: Endpoint.Azure.Sizes, r: {fixture: 'azure/sizes.json'}},
    {m: Method.GET, p: Endpoint.GCP.DiskTypes, r: {fixture: 'gcp/disktypes.json'}},
    {m: Method.GET, p: Endpoint.GCP.Sizes, r: {fixture: 'gcp/sizes.json'}},
    {m: Method.GET, p: Endpoint.GCP.Zones, r: {fixture: 'gcp/zones.json'}},
    {m: Method.GET, p: Endpoint.Equinix.Sizes, r: {fixture: 'packet/sizes.json'}},
    {m: Method.GET, p: Endpoint.Hetzner.Sizes, r: {fixture: 'hetzner/sizes.json'}},
    {m: Method.GET, p: Endpoint.OpenStack.AvailabilityZones, r: {fixture: 'openstack/availabilityzones.json'}},
    {m: Method.GET, p: Endpoint.OpenStack.Sizes, r: {fixture: 'openstack/sizes.json'}},
  ];

  static register(p?: Provider): void {
    Mocks._registerCommonMocks();

    if (p) {
      Mocks._registerProviderMocks(p);
    }
  }

  private static _registerCommonMocks(): void {
    this._common.forEach(mock => this._intercept(mock.m, mock.p, mock.r));
  }

  // TODO: Add paths into endpoint namespace.
  private static _registerProviderMocks(provider: Provider): void {
    this._intercept(Method.POST, '**/api/**/projects/*/clusters', {fixture: `${provider}/cluster.json`});
    this._intercept(Method.GET, '**/api/**/projects/*/clusters', {fixture: `${provider}/cluster.json`});
    this._intercept(Method.GET, '**/api/**/projects/*/clusters/*', {fixture: `${provider}/cluster.json`});
  }

  private static _intercept(method: Method, path: string, response?: RouteHandler): void {
    cy.intercept({method, path}, response).as(Mocks._alias(method, path));
  }

  private static _alias(method: Method, path: string): string {
    return `${method} ${path}`;
  }
}
