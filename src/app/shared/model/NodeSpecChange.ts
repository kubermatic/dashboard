import {
  CentosSpec,
  ContainerLinuxSpec,
  NodeCloudSpec,
  NodeSpec,
  RHELSpec,
  SLESSpec,
  UbuntuSpec,
  FlatcarSpec,
} from '../entity/node';

export class NodeData {
  name?: string;
  spec?: NodeSpec;
  count?: number;
  valid?: boolean;
  dynamicConfig?: boolean;

  static NewEmptyNodeData(): NodeData {
    return {
      spec: {
        operatingSystem: {
          ubuntu: {},
        },
        cloud: {} as NodeCloudSpec,
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
  rhel?: RHELSpec;
  flatcar?: FlatcarSpec;
}
