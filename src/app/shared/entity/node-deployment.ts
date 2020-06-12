import {NodeCloudSpec, NodeSpec, NodeVersionInfo, OperatingSystemSpec, Taint} from './NodeEntity';

export class NodeDeployment {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  spec: NodeDeploymentSpec;
  status?: NodeDeploymentStatus;
}

export class NodeDeploymentSpec {
  replicas: number;
  template: NodeSpec;
  paused?: boolean;
  dynamicConfig?: boolean;
}

export class NodeDeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
}

export class NodeDeploymentPatch {
  spec: NodeDeploymentSpecPatch;
}

export class NodeDeploymentSpecPatch {
  replicas?: number;
  template?: NodeSpecPatch;
  paused?: boolean;
  dynamicConfig?: boolean;
}

export class NodeSpecPatch {
  cloud?: NodeCloudSpec;
  operatingSystem?: OperatingSystemSpec;
  versions?: NodeVersionInfo;
  labels?: object;
  taints?: Taint[];
}
