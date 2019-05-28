import {NodeCloudSpec, NodeVersionInfo, OperatingSystemSpec, Taint} from './NodeEntity';

export class NodeDeploymentPatch {
  spec: NodeDeploymentSpecPatch;
}

export class NodeDeploymentSpecPatch {
  replicas?: number;
  template?: NodeSpecPatch;
  paused?: boolean;
}

export class NodeSpecPatch {
  cloud?: NodeCloudSpec;
  operatingSystem?: OperatingSystemSpec;
  versions?: NodeVersionInfo;
  labels?: object;
  taints?: Taint[];
}

export class NodeDeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
}
