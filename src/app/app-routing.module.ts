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
        loadChildren: './project/project.module#ProjectModule',
      },
      {
        path: 'projects/:projectID/wizard',
        loadChildren: './wizard/wizard.module#WizardModule',
      },
      {
        path: 'projects/:projectID/sshkeys',
        loadChildren: './sshkey/sshkey.module#SSHKeyModule',
      },
      {
        path: 'projects/:projectID/members',
        loadChildren: './member/member.module#MemberModule',
      },
      {
        path: 'projects/:projectID/serviceaccounts',
        loadChildren: './serviceaccount/serviceaccount.module#ServiceAccountModule',
      },
      {
        path: 'projects/:projectID/clusters',
        loadChildren: './cluster/cluster.module#ClusterModule',
      },
      {
        path: 'projects/:projectID/dc/:seedDc/clusters',
        loadChildren: './cluster/cluster.module#ClusterModule',
      },
      {path: 'account', loadChildren: './settings/user/user-settings.module#UserSettingsModule'},
      {
        path: 'settings',
        loadChildren: './settings/global/global-settings.module#GlobalSettingsModule',
      },
      {
        path: '',
        loadChildren: './pages/pages.module#PagesModule',
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
