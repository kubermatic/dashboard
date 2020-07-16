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
  path: string;
}

export class GCPSubnetwork {
  id: string;
  name: string;
  network: string;
  ipCidrRange: string;
  gatewayAddress: string;
  region: string;
  selfLink: string;
  privateIpGoogleAccess: boolean;
  kind: string;
  path: string;
}
