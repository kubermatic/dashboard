import {NodeCloudSpec, NodeVersionInfo, OperatingSystemSpec} from './NodeEntity';

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
}

export class NodeDeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
}
