import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import {FrontpageComponent} from "./frontpage/frontpage.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {AuthGuard} from "./auth/auth.guard";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {ProfileComponent} from "./profile/profile.component";



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
        path: "profile",
        component: ProfileComponent,
        canActivate: [AuthGuard],
        data: { title: "sshKeys" }
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
    ]
  },
  {
    path: "**",
    redirectTo: "login"
  },
];


