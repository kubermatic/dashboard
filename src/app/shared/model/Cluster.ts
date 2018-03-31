import { ClusterSpec } from '../entity/ClusterEntity';

export class CreateClusterModel {
  cluster: ClusterSpec;
  sshKeys: string[];

  constructor(cluster: ClusterSpec, sshKeys: string[]) {
    this.cluster = cluster;
    this.sshKeys = sshKeys;
  }
}
