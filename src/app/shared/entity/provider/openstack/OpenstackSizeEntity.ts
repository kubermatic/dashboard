export interface OpenstackFlavor {
  disk: number;
  isPublic: boolean;
  memory: number;
  region: string;
  slug: string;
  swap: number;
  vcpus: number;
}

export class OpenstackTenant {
  id: string;
  name: string;
}

export class OpenstackNetwork {
  id: string;
  name: string;
  external: boolean;
}

export class OpenstackFloatingIpPool {
  id: string;
  name: string;
  external: boolean;
}

export class OpenstackSubnet {
  id: string;
  name: string;
}

export class OpenstackSecurityGroup {
  id: string;
  name: string;
}

