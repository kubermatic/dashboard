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
  strategy?: NodeDeploymentStrategy;
  minReadySeconds?: number;
  revisionHistoryLimit?: number;
  paused?: boolean;
  progressDeadlineSeconds?: number;
}

export class NodeDeploymentStrategy {
  type?: string;
  rollingUpdate?: NodeDeploymentRollingUpdate;
}

export class NodeDeploymentRollingUpdate {
  maxUnavailable?: number|string;
  maxSurge?: number|string;
}

export class NodeDeploymentStatus {
  observedGeneration?: number;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number;
}
