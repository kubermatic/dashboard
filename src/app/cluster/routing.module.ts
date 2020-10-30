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

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard, AuthzGuard} from '@core/services/auth/guard';
import {ClusterDetailsComponent} from './cluster-details/component';
import {MachineDeploymentDetailsComponent} from './cluster-details/machine-deployment-details/component';
import {ClusterListComponent} from './cluster-list/component';
import {ExternalClusterDetailsComponent} from './external-cluster-details/component';

const routes: Routes = [
  {
    path: '',
    component: ClusterListComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
  {
    path: ':clusterName',
    component: ClusterDetailsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
  {
    path: 'external/:clusterName',
    component: ExternalClusterDetailsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
  {
    path: ':clusterName/md/:machineDeploymentID',
    component: MachineDeploymentDetailsComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClusterRoutingModule {}
