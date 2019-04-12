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
    data: {title: 'Clusters'},
  },
  {
    path: ':clusterName',
    component: ClusterDetailsComponent,
    canActivate: [AuthGuard],
    data: {title: 'Cluster Details'},
  },
  {
    path: ':clusterName/nd/:nodeDeploymentID',
    component: NodeDeploymentDetailsComponent,
    canActivate: [AuthGuard],
    data: {title: 'Node Deployment Details'},
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClusterRoutingModule {
}
