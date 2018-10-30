import { CentosSpec, ContainerLinuxSpec, NodeCloudSpec, NodeEntity, UbuntuSpec } from '../entity/NodeEntity';

export class NodeData {
  node?: NodeEntity;
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
