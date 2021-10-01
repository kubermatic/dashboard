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
  DELETE = 'DELETE',
  GET = 'GET',
  POST = 'POST',
}

// Prepares mock of auth cookies and saves them in the browser. Thanks to it the login page should be skipped.
export function mockAuthCookies(): void {
  const radix = 36;
  const slice = 2;
  const day = 8640000;
  const nonce = Math.random().toString(radix).slice(slice);
  const header = {alg: 'RS256', typ: 'JWT'};
  const payload = {
    iss: 'http://dex.oauth:5556/dex/auth',
    sub: btoa(Math.random().toString(radix).slice(slice)),
    aud: 'kubermatic',
    exp: Date.now() + day,
    iat: Date.now(),
    nonce: nonce,
    email: 'roxy@kubermatic.io',
    email_verified: true,
    name: 'roxy',
  };
  const signature = Math.random().toString(radix).slice(slice);
  const token =
    btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.' + btoa(JSON.stringify(signature));

  cy.setCookie('token', token);
  cy.setCookie('nonce', nonce);
  cy.setCookie('autoredirect', 'false');
}

// Mocks login action.
export function mockLogin(): void {
  mockAuthCookies();

  cy.visit('/projects');
}

// Registers standard set of interceptors for configuration like datacenters, seeds and settings. Interceptors can be
// modified later to simulate resource deletion or creation.
export function mockConfigEndpoints(): void {
  cy.intercept({method: Method.GET, path: '**/me'}, {fixture: 'config/me'}).as('getCurrentUser');
  cy.intercept({method: Method.GET, path: '**/seed'}, {fixture: 'config/seeds'}).as('getSeeds');
  cy.intercept({method: Method.GET, path: '**/seeds/*/settings'}, {fixture: 'config/seed-settings'}).as(
    'getSeedSettings'
  );
  cy.intercept({method: Method.GET, path: '**/dc'}, {fixture: 'config/datacenters'}).as('getDatacenters');
  cy.intercept({method: Method.GET, path: '**/providers/*/presets*'}, {fixture: 'config/preset'}).as('listPresets');
}

// Registers standard set of interceptors for projects. Interceptors can be modified later to simulate resource
// deletion or creation.
export function mockProjectEndpoints(): void {
  cy.intercept({method: Method.POST, path: '**/projects'}, {fixture: 'projects/single'}).as('createProject');
  cy.intercept({method: Method.GET, path: '**/projects*'}, {fixture: 'projects/list'}).as('listProjects');
  cy.intercept({method: Method.GET, path: '**/projects/*'}, {fixture: 'projects/single'}).as('getProject');
}

// Registers standard set of interceptors for clusters with chosen provider. Interceptors can be modified later
// to simulate resource deletion or creation.
export function mockClusterEndpoints(provider: Provider): void {
  const p = '**/projects/*/clusters'; // Common path for cluster related endpoints.
  cy.intercept({method: Method.POST, path: p}, {fixture: `clusters/${provider}/single.json`}).as('createCluster');
  cy.intercept({method: Method.GET, path: p}, {fixture: `clusters/${provider}/list.json`}).as('listClusters');
  cy.intercept({method: Method.GET, path: `${p}/*`}, {fixture: `clusters/${provider}/single.json`}).as('getCluster');
  cy.intercept({method: Method.GET, path: `${p}/*/health`}, {fixture: 'clusters/health.json'}).as('getHealth');
  cy.intercept({method: Method.GET, path: `${p}/*/metrics`}, {fixture: 'empty-list.json'}).as('listMetrics');
  cy.intercept({method: Method.GET, path: `${p}/*/machinedeployments`}, {fixture: 'empty-list.json'}).as(
    'listMachineDeployments'
  );
  cy.intercept({method: Method.GET, path: `${p}/*/nodes**`}, {fixture: 'empty-list.json'}).as('listNodes');
  cy.intercept({method: Method.GET, path: `${p}/*/events`}, {fixture: 'empty-list.json'}).as('listEvents');
  cy.intercept({method: Method.GET, path: `${p}/*/bindings`}, {fixture: 'empty-list.json'}).as('listBindings');
  cy.intercept({method: Method.GET, path: `${p}/*/clusterbindings`}, {fixture: 'empty-list.json'}).as(
    'listClusterBindings'
  );
  cy.intercept({method: Method.GET, path: `${p}/*/rulegroups`}, {fixture: 'empty-list.json'}).as('listRuleGroups');
  cy.intercept({method: Method.GET, path: `${p}/*/addons`}, {fixture: 'empty-list.json'}).as('listAddons');
  cy.intercept({method: Method.GET, path: `${p}/*/sshkeys`}, {fixture: 'empty-list.json'}).as('listSSHKeys');
  cy.intercept({method: Method.GET, path: `${p}/*/upgrades`}, {fixture: 'empty-list.json'}).as('listUpgrades');

  cy.intercept(
    {method: Method.GET, path: '**/projects/*/kubernetes/clusters'},
    {fixture: 'clusters/external/list.json'}
  ).as('listExternalClusters');
  cy.intercept({method: Method.GET, path: '**/projects/*/etcdrestores'}, {fixture: 'empty-list.json'}).as(
    'listEtcdRestores'
  );
  cy.intercept({method: Method.GET, path: '**/alertmanager/config'}, {fixture: 'empty-object.json'}).as(
    'getAlertmanagerConfig'
  );
  cy.intercept({method: Method.GET, path: '**/providers/*/versions'}, {fixture: 'clusters/versions.json'}).as(
    'listVersions'
  );

  switch (provider) {
    case Provider.AWS:
      cy.intercept({method: Method.GET, path: '**/aws/*/subnets'}, {fixture: 'clusters/aws/subnets.json'}).as(
        'listAWSSubnets'
      );
      cy.intercept({method: Method.GET, path: '**/aws/sizes'}, {fixture: 'clusters/aws/sizes.json'}).as('listAWSSizes');
  }
}
