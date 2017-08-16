import {ClusterEntity} from "../../api/entitiy/ClusterEntity";
import {DataCenterEntity} from "../../api/entitiy/DatacenterEntity";

export class AddNodeModalData {
  constructor(public cluster: ClusterEntity, public dc: DataCenterEntity) {
  }
}
