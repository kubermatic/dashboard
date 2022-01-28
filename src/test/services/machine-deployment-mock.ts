// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Injectable} from '@angular/core';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Observable, of} from 'rxjs';
import {Node} from '@shared/entity/node';
import {machineDeploymentsFake, nodesFake} from '../data/node';

@Injectable()
export class MachineDeploymentServiceMock {
  list(_cluster: string, _dc: string, _projectID: string): Observable<MachineDeployment[]> {
    return of(machineDeploymentsFake());
  }

  delete(_cluster: string, _machineDeployment: string, _dc: string, _project: string): Observable<any> {
    return of({});
  }

  getNodes(_mdId: string, _cluster: string, _projectID: string): Observable<Node[]> {
    return of(nodesFake());
  }

  getNodesEvents(_mdId: string, _cluster: string, _dc: string, _projectID: string): Observable<any[]> {
    return of([]);
  }

  getNodesMetrics(_mdId: string, _cluster: string, _projectID: string): Observable<any[]> {
    return of([]);
  }
}
