import {Routes} from '@angular/router';
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {AuthGuard} from "./auth/auth.guard";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {SshkeyComponent} from "./sshkey/sshkey.component";
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';

export const appRoutes: Routes = [
  {
    path: "login",
    component: FrontpageComponent,
    data: { title: "Welcome" }
  },
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
        data: { title: "SSH Keys" }
      },
      {
        path: "dc/:seedDcName/cluster/:clusterName",
        component: ClusterComponent,
        canActivate: [AuthGuard],
        data: { title: "Cluster details" }
      },
      {
        path: "clusters",
        component: ClusterListComponent,
        canActivate: [AuthGuard],
        data: { title: "Clusters" }
      },
      {
        path: "",
        redirectTo: 'clusters',
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


