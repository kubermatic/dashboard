import { ClusterSpec } from '../entity/ClusterEntity';

export class CreateClusterModel {
  name: string;
  spec: ClusterSpec;
  sshKeys: string[];

  constructor(name: string, cluster: ClusterSpec, sshKeys: string[]) {
    this.name = name;
    this.spec = cluster;
    this.sshKeys = sshKeys;
  }
}
