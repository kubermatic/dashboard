export class CreateClusterModel {
  cloud: CloudModel;
  spec: ClusterSpec;
  ssh_keys: Array<string>;

  constructor(cloud: CloudModel, spec: ClusterSpec, ssh_keys: Array<string>) {
    this.cloud = cloud;
    this.spec = spec;
    this.ssh_keys = ssh_keys;
  }
}

export class CloudModel {
  user: string;
  secret: string;
  name: string;
  region: string;

  constructor(user: string, secret: string, name: string, region: string) {
    this.user = user;
    this.secret = secret;
    this.name = name;
    this.region = region;
  }
}

export class ClusterSpec {
  humanReadableName: string;

  constructor(humanReadableName: string) {
    this.humanReadableName = humanReadableName;
  }
}
