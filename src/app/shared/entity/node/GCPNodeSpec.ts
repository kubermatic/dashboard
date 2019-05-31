export class GCPNodeSpec {
  diskSize: number;
  diskType: string;
  labels: object;
  machineType: string;
  preemptible: boolean;
  tags: string[];
  zone: string;
}
