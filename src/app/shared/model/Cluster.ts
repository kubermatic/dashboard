import { ClusterSpec } from '../entity/ClusterEntity';

export class CreateClusterModel {
  name: string;
  cluster: ClusterSpec;
  sshKeys: string[];

  constructor(name: string, cluster: ClusterSpec, sshKeys: string[]) {
    this.name = name;
    this.cluster = cluster;
    this.sshKeys = sshKeys;
  }
}
