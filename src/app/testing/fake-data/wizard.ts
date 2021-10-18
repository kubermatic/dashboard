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

import {
  OpenstackNetwork,
  OpenstackSecurityGroup,
  OpenstackSubnet,
  OpenstackTenant,
} from '@shared/entity/provider/openstack';

export function openstackTenantsFake(): OpenstackTenant[] {
  return [
    {
      id: 'id123',
      name: 'kubermatic-poc',
    },
    {
      id: 'id456',
      name: 'kubermatic-poc2',
    },
    {
      id: 'id789',
      name: 'another-kubermatic-poc',
    },
  ];
}

export function openstackNetworksFake(): OpenstackNetwork[] {
  return [
    {
      id: 'net123',
      name: 'test-network',
      external: false,
    },
    {
      id: 'net456',
      name: 'ext-net',
      external: false,
    },
    {
      id: 'net789',
      name: 'ext-net',
      external: true,
    },
  ];
}

export function openstackSortedNetworksFake(): OpenstackNetwork[] {
  return [
    {
      id: 'net456',
      name: 'ext-net',
      external: false,
    },
    {
      id: 'net123',
      name: 'test-network',
      external: false,
    },
  ];
}

export function openstackSecurityGroupsFake(): OpenstackSecurityGroup[] {
  return [
    {
      id: 'sg123',
      name: 'test-security-group',
    },
    {
      id: 'sg456',
      name: 'another-security-group',
    },
  ];
}

export function openstackSubnetIdsFake(): OpenstackSubnet[] {
  return [
    {
      id: 'sub123',
      name: 'test-subnet',
    },
    {
      id: 'sub456',
      name: 'another-subnet',
    },
  ];
}
