
export class SshKeys{
  aws: string[];
  digitalocean: string[];
  baremetal: string[];
  openstack: string[];

  constructor() {
      this.aws = [];
      this.digitalocean = [];
      this.baremetal = [];
      this.openstack = [];
  }
}
