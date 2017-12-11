import {ClusterEntity} from "../../shared/entity/ClusterEntity";
import {DataCenterEntity} from "../../shared/entity/DatacenterEntity";

export class AddNodeModalData {
  constructor(public cluster: ClusterEntity, public dc: DataCenterEntity) {
  }
}
