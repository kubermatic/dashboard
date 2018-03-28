import { AddNodeModalData } from '../../shared/model/add-node-modal-data';
import { clusterFake } from './cluster.fake';
import { datacentersFake } from './datacenter.fake';


export const addNodeModalFake: AddNodeModalData = {
  cluster: clusterFake,
  dc: datacentersFake[0]
};
