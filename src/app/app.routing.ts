import { Routes } from "@angular/router";
import { FrontpageComponent } from "./frontpage/frontpage.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { AuthGuard } from "./auth/auth.guard";
import { WizardComponent } from "./wizard/wizard.component";
import { ClusterComponent } from './cluster/cluster.component';
import { ClusterListComponent } from './cluster-list/cluster-list.component';


export const appRoutes: Routes = [
  {
    path: "",
    component: DashboardComponent,
    children: [
      {
        path: "wizard",
        component: WizardComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "welcome",
        component: FrontpageComponent
      }
    ]
  },
  {
    path: "dc/:seedDcName/cluster/:clusterName",
    component: ClusterComponent
  },
  {
    path: "cluster-list",
    component: ClusterListComponent
  },
  {
    path: "**",
    redirectTo: ""
  },
];
