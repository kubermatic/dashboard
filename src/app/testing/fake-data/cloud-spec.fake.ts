import {CloudSpec} from '../../shared/entity/ClusterEntity';

export function doCloudSpecFake(): CloudSpec {
  return {
    dc: 'datacenter1',
    digitalocean: {
      token: 'foo-bar',
    },
  };
}
