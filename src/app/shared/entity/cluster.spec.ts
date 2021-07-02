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

import {
  fakeAlibabaCluster,
  fakeAWSCluster,
  fakeAzureCluster,
  fakeBringyourownCluster,
  fakeDigitaloceanCluster,
  fakeHetznerCluster,
  fakeOpenstackCluster,
  fakePacketCluster,
  fakeVSphereCluster,
} from '@app/testing/fake-data/cluster';

import {Cluster} from './cluster';

describe('ClusterEntity', () => {
  it('should get correct provider', () => {
    expect(Cluster.getProvider(fakeDigitaloceanCluster().spec.cloud)).toBe('digitalocean');
    expect(Cluster.getProvider(fakeAWSCluster().spec.cloud)).toBe('aws');
    expect(Cluster.getProvider(fakeOpenstackCluster().spec.cloud)).toBe('openstack');
    expect(Cluster.getProvider(fakeBringyourownCluster().spec.cloud)).toBe('bringyourown');
    expect(Cluster.getProvider(fakeHetznerCluster().spec.cloud)).toBe('hetzner');
    expect(Cluster.getProvider(fakeVSphereCluster().spec.cloud)).toBe('vsphere');
    expect(Cluster.getProvider(fakeAzureCluster().spec.cloud)).toBe('azure');
    expect(Cluster.getProvider(fakePacketCluster().spec.cloud)).toBe('packet');
    expect(Cluster.getProvider(fakeAlibabaCluster().spec.cloud)).toBe('alibaba');
  });

  it('should get correct version headline', () => {
    expect(Cluster.getVersionHeadline('kubernetes', false)).toBe('Master Version');
    expect(Cluster.getVersionHeadline('kubernetes', true)).toBe('kubelet Version');
  });
});
