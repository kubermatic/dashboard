import {CloudSpec} from '../../entity/ClusterEntity';

export class ClusterUtils {
  static getProvider(cloud: CloudSpec): string {
    if (cloud.aws) {
      return 'aws';
    } else if (cloud.digitalocean) {
      return 'digitalocean';
    } else if (cloud.openstack) {
      return 'openstack';
    } else if (cloud.bringyourown) {
      return 'bringyourown';
    } else if (cloud.hetzner) {
      return 'hetzner';
    } else if (cloud.vsphere) {
      return 'vsphere';
    } else if (cloud.azure) {
      return 'azure';
    } else if (cloud.openshift) {
      return 'openshift';
    }
  }
}
