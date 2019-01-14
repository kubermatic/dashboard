import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ClusterDetailsComponent} from '../cluster/cluster-details/cluster-details.component';
import {AuthGuard} from '../core/services/auth/auth.guard';

import {NodeDeploymentDetailsComponent} from './cluster-details/node-deployment-details/node-deployment-details.component';
import {ClusterListComponent} from './cluster-list/cluster-list.component';

const routes: Routes = [
  {
    path: '',
    component: ClusterListComponent,
    canActivate: [AuthGuard],
    data: {title: 'Manage Clusters'},
  },
  {
    path: ':clusterName',
    component: ClusterDetailsComponent,
    canActivate: [AuthGuard],
    data: {title: 'Cluster details'},
  },
  {
    path: ':clusterName/nd/:nodeDeploymentID',
    component: NodeDeploymentDetailsComponent,
    canActivate: [AuthGuard],
    data: {title: 'Node Deployment details'},
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClusterRoutingModule {
}
