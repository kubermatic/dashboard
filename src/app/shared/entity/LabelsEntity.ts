export enum ResourceType {
  Cluster = 'cluster',
  Project = 'project',
  NodeDeployment = 'nodedeployment'
}

export type ResourceLabelMap = {
  [key in ResourceType]: string[]
};
