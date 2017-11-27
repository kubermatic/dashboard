import { ClusterListComponent } from './cluster-list/cluster-list.component';
import { AuthGuard } from './../core/services/auth/auth.guard';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClusterComponent } from 'app/cluster/cluster.component';


const routes: Routes = [
    {
        path: '',
        component: ClusterListComponent,
        canActivate: [AuthGuard],
        data: { title: "Manage Clusters" }
    },
    {
        path: ':clusterName',
        component: ClusterComponent,
        canActivate: [AuthGuard],
        data: { title: "Cluster details" }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ClusterRoutingModule { }
