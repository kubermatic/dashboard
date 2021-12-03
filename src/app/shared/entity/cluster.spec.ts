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
  fakeAlibabaCluster,
  fakeAWSCluster,
  fakeAzureCluster,
  fakeBringyourownCluster,
  fakeDigitaloceanCluster,
  fakeHetznerCluster,
  fakeOpenstackCluster,
  fakeEquinixCluster,
  fakeVSphereCluster,
} from '@app/testing/fake-data/cluster';

import {Cluster} from './cluster';
import {Provider} from '../../../../cypress/utils/provider';

describe('ClusterEntity', () => {
  it('should get correct provider', () => {
    expect(Cluster.getProvider(fakeDigitaloceanCluster().spec.cloud)).toBe(Provider.Digitalocean);
    expect(Cluster.getProvider(fakeAWSCluster().spec.cloud)).toBe(Provider.AWS);
    expect(Cluster.getProvider(fakeOpenstackCluster().spec.cloud)).toBe(Provider.OpenStack);
    expect(Cluster.getProvider(fakeBringyourownCluster().spec.cloud)).toBe(Provider.kubeAdm);
    expect(Cluster.getProvider(fakeHetznerCluster().spec.cloud)).toBe(Provider.Hetzner);
    expect(Cluster.getProvider(fakeVSphereCluster().spec.cloud)).toBe(Provider.VSphere);
    expect(Cluster.getProvider(fakeAzureCluster().spec.cloud)).toBe(Provider.Azure);
    expect(Cluster.getProvider(fakeEquinixCluster().spec.cloud)).toBe(Provider.Equinix);
    expect(Cluster.getProvider(fakeAlibabaCluster().spec.cloud)).toBe(Provider.Alibaba);
  });

  it('should get correct version headline', () => {
    expect(Cluster.getVersionHeadline('kubernetes', false)).toBe('Control Plane Version');
    expect(Cluster.getVersionHeadline('kubernetes', true)).toBe('kubelet Version');
  });
});
