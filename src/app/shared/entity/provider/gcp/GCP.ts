export class GCPMachineSize {
  name: string;
  description: string;
  memory: number;
  vcpus: number;
}

export class GCPDiskType {
  name: string;
  description: string;
}

export class GCPZone {
  name: string;
}

export class GCPNetwork {
  id: string;
  name: string;
  autoCreateSubnetworks: boolean;
  subnetworks: string[];
  kind: string;
}
