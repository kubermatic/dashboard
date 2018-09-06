import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './../core/services/auth/auth.guard';

import { ClusterDetailsComponent } from '../cluster/cluster-details/cluster-details.component';
import { ClusterListComponent } from './cluster-list/cluster-list.component';

const routes: Routes = [
  {
    path: ':projectID',
    component: ClusterListComponent,
    canActivate: [AuthGuard],
    data: { title: 'Manage Clusters' }
  },
  {
    path: ':projectID/:seedDc/:clusterName',
    component: ClusterDetailsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Cluster details' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClusterRoutingModule {
}
