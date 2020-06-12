import {ClusterSpec} from '../entity/cluster';
import {NodeDeployment} from '../entity/node-deployment';

export class CreateClusterModel {
  cluster: ClusterModel;
  nodeDeployment?: NodeDeployment;
}

class ClusterModel {
  name: string;
  spec: ClusterSpec;
  labels?: object;
  type: string;
  credential?: string;
}
