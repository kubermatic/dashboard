import {CentosSpec, ContainerLinuxSpec, NodeCloudSpec, NodeSpec, SLESSpec, UbuntuSpec} from '../entity/NodeEntity';

export class NodeData {
  name?: string;
  spec?: NodeSpec;
  count?: number;
  valid?: boolean;
  dynamicConfig?: boolean;

  static NewEmptyNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          aws: {},
          azure: {},
          digitalocean: {},
          gcp: {},
          hetzner: {},
          kubevirt: {},
          openstack: {},
          packet: {},
          vsphere: {},
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}

export class NodeProviderData {
  spec?: NodeCloudSpec;
  valid?: boolean;
}

export class NodeOperatingSystemData {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  containerLinux?: ContainerLinuxSpec;
  sles?: SLESSpec;
}
