import {CloudSpec} from '../../shared/entity/ClusterEntity';

export function doCloudSpecFake(): CloudSpec {
  return {
    dc: 'datacenter1',
    digitalocean: {
      token: 'foo-bar',
    },
    aws: null,
    baremetal: null,
    bringyourown: null,
    openstack: null,
    vsphere: null,
    hetzner: null,
    azure: null,
  };
}
