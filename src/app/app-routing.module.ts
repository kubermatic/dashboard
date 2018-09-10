import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';

const appRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'projects',
        loadChildren: './project/project.module#ProjectModule',
      },
      {
        path: 'wizard',
        loadChildren: './wizard/wizard.module#WizardModule',
      },
      {
        path: 'projects/:projectID/sshkeys',
        loadChildren: './sshkey/sshkey.module#SSHKeyModule'
      },
      {
      path: 'projects/:projectID/members',
        loadChildren: './member/member.module#MemberModule'
      },
      {
        path: 'projects/:projectID/clusters',
        loadChildren: './cluster/cluster.module#ClusterModule'
      },
      {
        path: 'projects/:projectID/dc/:seedDc/clusters',
        loadChildren: './cluster/cluster.module#ClusterModule'
      },
      {
        path: '',
        loadChildren: './pages/pages.module#PagesModule'
      },
    ]
  },
  {
    path: '**',
    redirectTo: '404'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}


