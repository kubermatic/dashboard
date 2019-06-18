import {CloudSpec, ClusterEntity} from '../../entity/ClusterEntity';

export enum ClusterType {
  Kubernetes = 'kubernetes',
  OpenShift = 'openshift',
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
    }
  }

  static getType(type: string): ClusterType {
    switch (type) {
      case 'kubernetes':
        return ClusterType.Kubernetes;
      case 'openshift':
        return ClusterType.OpenShift;
    }
  }

  static isOpenshiftType(cluster: ClusterEntity): boolean {
    return ClusterUtils.getType(cluster.type) === ClusterType.OpenShift;
  }

  static getVersionHeadline(type: string, isKubelet: boolean): string {
    if (type === 'kubernetes') {
      return isKubelet ? 'kubelet Version' : 'Master Version';
    } else if (type === 'openshift') {
      return 'OpenShift Version';
    }
  }
}
