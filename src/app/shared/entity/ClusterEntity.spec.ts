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

import {ClusterEntity} from './ClusterEntity';

describe('ClusterEntity', () => {
  it('should get correct provider', () => {
    expect(
      ClusterEntity.getProvider(fakeDigitaloceanCluster().spec.cloud)
    ).toBe('digitalocean');
    expect(ClusterEntity.getProvider(fakeAWSCluster().spec.cloud)).toBe('aws');
    expect(ClusterEntity.getProvider(fakeOpenstackCluster().spec.cloud)).toBe(
      'openstack'
    );
    expect(
      ClusterEntity.getProvider(fakeBringyourownCluster().spec.cloud)
    ).toBe('bringyourown');
    expect(ClusterEntity.getProvider(fakeHetznerCluster().spec.cloud)).toBe(
      'hetzner'
    );
    expect(ClusterEntity.getProvider(fakeVSphereCluster().spec.cloud)).toBe(
      'vsphere'
    );
    expect(ClusterEntity.getProvider(fakeAzureCluster().spec.cloud)).toBe(
      'azure'
    );
    expect(ClusterEntity.getProvider(fakePacketCluster().spec.cloud)).toBe(
      'packet'
    );
    expect(ClusterEntity.getProvider(fakeAlibabaCluster().spec.cloud)).toBe(
      'alibaba'
    );
  });

  it('should get correct version headline', () => {
    expect(ClusterEntity.getVersionHeadline('kubernetes', false)).toBe(
      'Master Version'
    );
    expect(ClusterEntity.getVersionHeadline('kubernetes', true)).toBe(
      'kubelet Version'
    );
    expect(ClusterEntity.getVersionHeadline('openshift', false)).toBe(
      'OpenShift Version'
    );
  });
});
