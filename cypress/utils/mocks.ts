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
  private static _defaults: Mock[] = [
    {m: Method.GET, p: Endpoint.CurrentUser, r: {fixture: 'me.json'}},
    {m: Method.GET, p: Endpoint.Seeds, r: ['test-seed']},
    {m: Method.GET, p: Endpoint.SeedSettings, r: {fixture: 'seed-settings.json'}},
    {m: Method.GET, p: Endpoint.Datacenters, r: {fixture: 'datacenters.json'}},
    {m: Method.GET, p: Endpoint.Presets, r: {fixture: 'preset.json'}},
    {m: Method.GET, p: Endpoint.CustomLinks, r: []},
    {m: Method.GET, p: Endpoint.Addons, r: []},
    {m: Method.GET, p: Endpoint.AddonConfigs, r: []},
    {m: Method.GET, p: Endpoint.SystemLabels, r: {}},
    {m: Method.POST, p: Endpoint.Projects, r: {fixture: 'project.json'}},
    {m: Method.GET, p: Endpoint.Projects, r: {fixture: 'projects.json'}},
    {m: Method.GET, p: Endpoint.Project, r: {fixture: 'project.json'}},
    {m: Method.GET, p: Endpoint.ExternalClusters, r: []},
    {m: Method.GET, p: Endpoint.EtcdRestores, r: []},
    {m: Method.GET, p: Endpoint.AlertmanagerConfig, r: {}},
    {m: Method.GET, p: Endpoint.Versions, r: {fixture: 'versions.json'}},
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

  static register(provider?: Provider): void {
    Mocks._registerDefaultMocks();

    if (provider) {
      Mocks._registerProviderMocks(provider);
    }
  }

  private static _registerDefaultMocks(): void {
    this._defaults.forEach(mock => this._intercept(mock.m, mock.p, mock.r));
  }

  private static _registerProviderMocks(provider: Provider): void {
    this._intercept(Method.POST, Endpoint.Clusters, {fixture: `${provider}/cluster.json`});
    this._intercept(Method.GET, Endpoint.Clusters, {fixture: `${provider}/cluster.json`});
    this._intercept(Method.GET, Endpoint.Cluster, {fixture: `${provider}/cluster.json`});
  }

  private static _intercept(method: Method, path: string, response?: RouteHandler): void {
    cy.intercept({method, path}, response).as(Mocks._alias(method, path));
  }

  private static _alias(method: Method, path: string): string {
    return `${method} ${path}`;
  }
}
