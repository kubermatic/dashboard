import {fakeAWSCluster, fakeAzureCluster, fakeBringyourownCluster, fakeDigitaloceanCluster, fakeHetznerCluster, fakeOpenstackCluster, fakePacketCluster, fakeVSphereCluster} from '../../../testing/fake-data/cluster.fake';

import {ClusterType, ClusterUtils} from './cluster-utils';

describe('ClusterUtils', () => {
  it('should get correct provider', () => {
    expect(ClusterUtils.getProvider(fakeDigitaloceanCluster().spec.cloud)).toBe('digitalocean');
    expect(ClusterUtils.getProvider(fakeAWSCluster().spec.cloud)).toBe('aws');
    expect(ClusterUtils.getProvider(fakeOpenstackCluster().spec.cloud)).toBe('openstack');
    expect(ClusterUtils.getProvider(fakeBringyourownCluster().spec.cloud)).toBe('bringyourown');
    expect(ClusterUtils.getProvider(fakeHetznerCluster().spec.cloud)).toBe('hetzner');
    expect(ClusterUtils.getProvider(fakeVSphereCluster().spec.cloud)).toBe('vsphere');
    expect(ClusterUtils.getProvider(fakeAzureCluster().spec.cloud)).toBe('azure');
    expect(ClusterUtils.getProvider(fakePacketCluster().spec.cloud)).toBe('packet');
  });

  it('should get correct type', () => {
    expect(ClusterUtils.getType('kubernetes')).toBe(ClusterType.Kubernetes);
    expect(ClusterUtils.getType('openshift')).toBe(ClusterType.OpenShift);
  });

  it('should get correct version headline', () => {
    expect(ClusterUtils.getVersionHeadline('kubernetes', false)).toBe('Master Version');
    expect(ClusterUtils.getVersionHeadline('kubernetes', true)).toBe('Kubelet Version');
    expect(ClusterUtils.getVersionHeadline('openshift', false)).toBe('OpenShift Version');
  });
});
