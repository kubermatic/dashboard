import {ClusterSpec} from '../entity/ClusterEntity';

export class CreateClusterModel {
  name: string;
  spec: ClusterSpec;
  sshKeys: string[];

  constructor(name: string, spec: ClusterSpec, sshKeys: string[]) {
    this.name = name;
    this.spec = spec;
    this.sshKeys = sshKeys;
  }
}
