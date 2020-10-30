// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NodeData, NodeOperatingSystemData, NodeProviderData} from '../../../shared/model/NodeSpecChange';

@Injectable()
export class NodeDataService {
  private _nodeProviderData = new Subject<NodeProviderData>();
  nodeProviderDataChanges$ = this._nodeProviderData.asObservable();
  private _nodeData = new Subject<NodeData>();
  nodeDataChanges$ = this._nodeData.asObservable();

  private _nodeOperatingSystemData = new Subject<NodeOperatingSystemData>();
  nodeOperatingSystemDataChanges$ = this._nodeOperatingSystemData.asObservable();

  changeNodeProviderData(data: NodeProviderData): void {
    this._nodeProviderData.next(data);
  }

  changeNodeData(data: NodeData): void {
    this._nodeData.next(data);
  }

  changeNodeOperatingSystemData(data: NodeOperatingSystemData): void {
    this._nodeOperatingSystemData.next(data);
  }
}
