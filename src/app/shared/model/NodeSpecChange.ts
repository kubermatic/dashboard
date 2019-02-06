import {CentosSpec, ContainerLinuxSpec, NodeCloudSpec, NodeSpec, UbuntuSpec} from '../entity/NodeEntity';

export class NodeData {
  name?: string;
  spec?: NodeSpec;
  count?: number;
  valid?: boolean;
}

export class NodeProviderData {
  spec?: NodeCloudSpec;
  valid?: boolean;
}

export class NodeOperatingSystemData {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  containerLinux?: ContainerLinuxSpec;
}
