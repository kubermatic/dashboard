import {ClusterSpec} from "../entitiy/ClusterEntity";

export class CreateClusterModel {
  cluster: ClusterSpec;
  ssh_keys: string[];

  constructor(cluster: ClusterSpec, ssh_keys: string[]) {
    this.cluster = cluster;
    this.ssh_keys = ssh_keys;
  }
}

