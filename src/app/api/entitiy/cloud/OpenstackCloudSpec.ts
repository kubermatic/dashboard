export class OpenstackCloudSpec {
  username: string;
  password: string;
  tenant: string;
  domain: string;
  network: string;
  securityGroups: string;
  floatingIpPool: string;

  constructor(username: string, 
              password: string, 
              tenant: string, 
              domain: string, 
              network: string, 
              securityGroups: string, 
              floatingIpPool: string) {
    this.username = username;
    this.password = password;
    this.tenant = tenant;
    this.domain = domain;
    this.network = network;
    this.securityGroups = securityGroups;
    this.floatingIpPool = floatingIpPool;
  }
}
