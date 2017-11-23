import { NgModule } from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {FrontpageComponent} from "./frontpage/frontpage.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {AuthGuard} from "./core/services";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {SshkeyComponent} from "./sshkey/sshkey.component";
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';

const appRoutes: Routes = [
  {
    path: "",
    component: DashboardComponent,
    children: [
      {
        path: "wizard",
        component: WizardComponent,
        canActivate: [AuthGuard],
        data: { title: "Create Cluster with Nodes" }
      },
      {
        path: "sshkeys",
        component: SshkeyComponent,
        canActivate: [AuthGuard],
        data: { title: "Manage SSH Keys" }
      },
      {
        path: "cluster/:clusterName",
        component: ClusterComponent,
        canActivate: [AuthGuard],
        data: { title: "Cluster details" }
      },
      {
        path: "clusters",
        component: ClusterListComponent,
        canActivate: [AuthGuard],
        data: { title: "Manage Clusters" }
      },
      {
        path: "",
        component: FrontpageComponent,
        pathMatch: 'full',
      }
    ]
  },
  {
    path: "404",
    component: PageNotFoundComponent
  },
  {
    path: "**",
    redirectTo: "404"
  },
];

@NgModule({
  imports: [ RouterModule.forRoot(appRoutes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}


