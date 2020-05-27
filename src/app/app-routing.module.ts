import {NgModule} from '@angular/core';
import {PreloadingStrategy, Route, RouterModule, Routes} from '@angular/router';
import {Observable, of} from 'rxjs';
import {environment} from '../environments/environment';
import {DashboardComponent} from './dashboard/dashboard.component';

class SelectedPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: Function): Observable<any> {
    return route.data && route.data['preload'] ? load() : of(null);
  }
}

function createRouting(): Routes {
  const routes = [
    {
      path: '',
      component: DashboardComponent,
      children: [
        {
          path: 'projects',
          loadChildren: () =>
            import('./project/project.module').then(m => m.ProjectModule),
        },
        {
          path: 'projects/:projectID/wizard',
          loadChildren: () =>
            import('./wizard/wizard.module').then(m => m.WizardModule),
        },
        {
          path: 'projects/:projectID/sshkeys',
          loadChildren: () =>
            import('./sshkey/sshkey.module').then(m => m.SSHKeyModule),
        },
        {
          path: 'projects/:projectID/members',
          loadChildren: () =>
            import('./member/member.module').then(m => m.MemberModule),
        },
        {
          path: 'projects/:projectID/serviceaccounts',
          loadChildren: () =>
            import('./serviceaccount/serviceaccount.module').then(
              m => m.ServiceAccountModule
            ),
        },
        {
          path: 'projects/:projectID/clusters',
          loadChildren: () =>
            import('./cluster/cluster.module').then(m => m.ClusterModule),
        },
        {
          path: 'projects/:projectID/dc/:seedDc/clusters',
          loadChildren: () =>
            import('./cluster/cluster.module').then(m => m.ClusterModule),
        },
        {
          path: 'account',
          loadChildren: () =>
            import('./settings/user/user-settings.module').then(
              m => m.UserSettingsModule
            ),
          data: {preload: true},
        },
        {
          path: 'settings',
          loadChildren: () =>
            import('./settings/admin/admin-settings.module').then(
              m => m.AdminSettingsModule
            ),
        },
        {
          path: '',
          loadChildren: () =>
            import('./pages/pages.module').then(m => m.PagesModule),
        },
      ],
    },
    {
      path: '**',
      redirectTo: '404',
    },
  ];

  // Add new wizard routing only to dev builds
  // TODO: Remove once it replaces the old wizard
  if (!environment.production) {
    routes[0].children = [
      {
        path: 'projects/:projectID/wizard-new',
        loadChildren: () =>
          import('./wizard-new/module').then(m => m.WizardModule),
      },
      ...routes[0].children,
    ];
  }

  return routes;
}

@NgModule({
  imports: [
    RouterModule.forRoot(createRouting(), {
      preloadingStrategy: SelectedPreloadingStrategy,
    }),
  ],
  providers: [SelectedPreloadingStrategy],
  exports: [RouterModule],
})
export class AppRoutingModule {}
