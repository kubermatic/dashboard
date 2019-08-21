import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';

const appRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'projects',
        loadChildren: () => import('./project/project.module').then(m => m.ProjectModule),
      },
      {
        path: 'projects/:projectID/wizard',
        loadChildren: () => import('./wizard/wizard.module').then(m => m.WizardModule),
      },
      {path: 'projects/:projectID/wizard-new', loadChildren: './wizard-new/module#WizardModule'},
      {
        path: 'projects/:projectID/sshkeys',
        loadChildren: () => import('./sshkey/sshkey.module').then(m => m.SSHKeyModule),
      },
      {
        path: 'projects/:projectID/members',
        loadChildren: () => import('./member/member.module').then(m => m.MemberModule),
      },
      {
        path: 'projects/:projectID/serviceaccounts',
        loadChildren: () => import('./serviceaccount/serviceaccount.module').then(m => m.ServiceAccountModule),
      },
      {
        path: 'projects/:projectID/clusters',
        loadChildren: () => import('./cluster/cluster.module').then(m => m.ClusterModule),
      },
      {
        path: 'projects/:projectID/dc/:seedDc/clusters',
        loadChildren: () => import('./cluster/cluster.module').then(m => m.ClusterModule),
      },
      {
        path: 'account',
        loadChildren: () => import('./settings/user/user-settings.module').then(m => m.UserSettingsModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/admin/admin-settings.module').then(m => m.AdminSettingsModule),
      },
      {
        path: '',
        loadChildren: () => import('./pages/pages.module').then(m => m.PagesModule),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '404',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
