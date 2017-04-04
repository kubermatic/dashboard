import {Routes, RouterModule} from "@angular/router";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {AuthGuard} from "./auth/auth.guard";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {ProfileComponent} from "./profile/profile.component";

export const appRoutes: Routes = [
  {
    path: "welcome",
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
        data: { title: "Wizard" }
      },
      {
        path: "profile",
        component: ProfileComponent,
        canActivate: [AuthGuard],
        data: { title: "Profile" }
      },
      {
        path: "dc/:seedDcName/cluster/:clusterName",
        component: ClusterComponent,
        canActivate: [AuthGuard],
        data: { title: "Cluster detail" }
      },
      {
        path: "clusters",
        component: ClusterListComponent,
        canActivate: [AuthGuard],
        data: { title: "Clusters" }
      },
    ]
  },
  {
    path: "**",
    redirectTo: "welcome"
  },
];
