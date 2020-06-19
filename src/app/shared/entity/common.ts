export class Metadata {
  name?: string;
  selfLink?: string;
  uid?: string;
  annotations?: Map<string, string>;
  creationTimestamp?: Date;
  labels?: Map<string, string>;
  deletionTimestamp?: Date;
}

export class ObjectReference {
  name: string;
  namespace: string;
  type: string;
}

export enum ResourceType {
  Cluster = 'cluster',
  Project = 'project',
  NodeDeployment = 'nodedeployment',
}

export type ResourceLabelMap = {
  [key in ResourceType]: string[];
};
