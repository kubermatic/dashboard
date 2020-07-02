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
} from '../../testing/fake-data/cluster.fake';

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
    expect(Cluster.getVersionHeadline('openshift', false)).toBe('OpenShift Version');
  });
});
