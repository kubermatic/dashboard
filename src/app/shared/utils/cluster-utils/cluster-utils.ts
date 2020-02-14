import {CloudSpec, ClusterEntity} from '../../entity/ClusterEntity';

export enum ClusterType {
  Kubernetes = 'kubernetes',
  OpenShift = 'openshift',
  Empty = '',
}

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
    } else if (cloud.packet) {
      return 'packet';
    } else if (cloud.gcp) {
      return 'gcp';
    } else if (cloud.kubevirt) {
      return 'kubevirt';
    }
  }

  static isOpenshiftType(cluster: ClusterEntity): boolean {
    return cluster.type === ClusterType.OpenShift;
  }

  static getVersionHeadline(type: string, isKubelet: boolean): string {
    if (type === 'kubernetes') {
      return isKubelet ? 'kubelet Version' : 'Master Version';
    } else if (type === 'openshift') {
      return 'OpenShift Version';
    }
  }
}
