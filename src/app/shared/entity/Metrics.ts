export class ClusterMetrics {
  name: string;
  controlPlane: ControlPlaneMetrics;
  nodes: NodesMetrics;
}

export class ControlPlaneMetrics {
  memoryTotalBytes: number;
  cpuTotalMillicores: number;
}

export class NodesMetrics {
  memoryTotalBytes: number;
  memoryAvailableBytes: number;
  memoryUsedPercentage: number;
  cpuTotalMillicores: number;
  cpuAvailableMillicores: number;
  cpuUsedPercentage: number;
}

export class NodeMetrics {
  name: string;
  memoryTotalBytes: number;
  memoryAvailableBytes: number;
  memoryUsedPercentage: number;
  cpuTotalMillicores: number;
  cpuAvailableMillicores: number;
  cpuUsedPercentage: number;
}
