import {NodeSpec} from '../../entity/NodeEntity';

export class NodeUtils {
  static getOperatingSystem(spec: NodeSpec): string {
    if (spec.operatingSystem.ubuntu) {
      return 'Ubuntu';
    } else if (spec.operatingSystem.centos) {
      return 'CentOS';
    } else if (spec.operatingSystem.containerLinux) {
      return 'Container Linux';
    } else if (spec.operatingSystem.sles) {
      return 'SLES';
    } else if (spec.operatingSystem.rhel) {
      return 'RHEL';
    } else if (spec.operatingSystem.flatcar) {
      return 'Flatcar';
    }
    return '';
  }

  static getOperatingSystemLogoClass(spec: NodeSpec): string {
    if (spec.operatingSystem.ubuntu) {
      return 'ubuntu';
    } else if (spec.operatingSystem.centos) {
      return 'centos';
    } else if (spec.operatingSystem.containerLinux) {
      return 'container-linux';
    } else if (spec.operatingSystem.sles) {
      return 'sles';
    } else if (spec.operatingSystem.rhel) {
      return 'rhel';
    } else if (spec.operatingSystem.flatcar) {
      return 'flatcar';
    }
    return '';
  }
}
