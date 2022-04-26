// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Config} from '@utils/config';
import _ from 'lodash';
import {ClusterDetail} from './detail/page';
import {ClusterList} from './list/page';

export enum ProviderMenuOption {
  EditCluster = 'Edit Cluster',
  ManageSSHKeys = 'Manage SSH keys',
}

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
