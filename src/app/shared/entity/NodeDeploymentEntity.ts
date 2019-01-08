import {NodeSpec} from './NodeEntity';

export class NodeDeploymentEntity {
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
}

export class NodeDeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
}
