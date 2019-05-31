import {ClusterSpec} from '../entity/ClusterEntity';
import {NodeDeploymentEntity} from '../entity/NodeDeploymentEntity';

export class CreateClusterModel {
  cluster: ClusterModel;
  nodeDeployment?: NodeDeploymentEntity;
}

class ClusterModel {
  name: string;
  spec: ClusterSpec;
  type: string;
  sshKeys: string[];
}
