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
  fakeVSphereCluster,
} from '@test/data/cluster';

import {Cluster, Provider} from './cluster';

describe('ClusterEntity', () => {
  it('should get correct provider', () => {
    expect(Cluster.getProvider(fakeDigitaloceanCluster())).toBe(Provider.Digitalocean);
    expect(Cluster.getProvider(fakeAWSCluster())).toBe(Provider.AWS);
    expect(Cluster.getProvider(fakeOpenstackCluster())).toBe(Provider.OpenStack);
    expect(Cluster.getProvider(fakeBringyourownCluster())).toBe(Provider.kubeAdm);
    expect(Cluster.getProvider(fakeHetznerCluster())).toBe(Provider.Hetzner);
    expect(Cluster.getProvider(fakeVSphereCluster())).toBe(Provider.VSphere);
    expect(Cluster.getProvider(fakeAzureCluster())).toBe(Provider.Azure);
    expect(Cluster.getProvider(fakeAlibabaCluster())).toBe(Provider.Alibaba);
  });
});
