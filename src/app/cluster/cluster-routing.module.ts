import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../core/services';

import {ClusterDetailsComponent} from './cluster-details/cluster-details.component';
import {NodeDeploymentDetailsComponent} from './cluster-details/node-deployment-details/node-deployment-details.component';
import {ClusterListComponent} from './cluster-list/cluster-list.component';

const routes: Routes = [
  {
    path: '',
    component: ClusterListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':clusterName',
    component: ClusterDetailsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ':clusterName/nd/:nodeDeploymentID',
    component: NodeDeploymentDetailsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClusterRoutingModule {
}
