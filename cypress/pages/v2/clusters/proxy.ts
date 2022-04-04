import _ from 'lodash';
import {Config} from '../../../utils/config';
import {ClusterDetail} from './detail/page';
import {ClusterList} from './list/page';

export class Clusters {
  private static _clusterName: string;
  private readonly _clusterList: ClusterList;
  private readonly _clusterDetail: ClusterDetail;

  get List(): ClusterList {
    return this._clusterList;
  }

  get Details(): ClusterDetail {
    return this._clusterDetail;
  }

  constructor(isAPIMocked: boolean) {
    this._clusterList = new ClusterList(isAPIMocked);
    this._clusterDetail = new ClusterDetail(isAPIMocked);
  }

  static getName(): string {
    if (!this._clusterName) {
      const prefix = 'test-cluster';
      this._clusterName = Config.isAPIMocked() ? prefix : _.uniqueId(`${prefix}-`);
    }

    return this._clusterName;
  }
}
