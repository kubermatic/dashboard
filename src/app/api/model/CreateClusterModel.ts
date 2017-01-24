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
  key: string;
  secret: string;
  name: string;
  region: string;

  constructor(user: string, key: string, secret: string, name: string, region: string) {
    this.user = user;
    this.key = key;
    this.secret = secret;
    this.name = name;
    this.region = region;
  }
}

export class ClusterSpec {
  human_readable_name: string;

  constructor(human_readable_name: string) {
    this.human_readable_name = human_readable_name;
  }
}
