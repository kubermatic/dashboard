export class OpenstackCloudSpec {
  username: string;
  password: string;
  tenant: string;
  domain: string;
  network: string;
  security_groups: string;
  floating_ip_pool: string;

  constructor(username: string, password: string, tenant: string, domain: string, network: string, security_groups: string, floating_ip_pool: string) {
    this.username = username;
    this.password = password;
    this.tenant = tenant;
    this.domain = domain;
    this.network = network;
    this.security_groups = security_groups;
    this.floating_ip_pool = floating_ip_pool;
  }
}
