// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NgModule} from '@angular/core';
import {PreloadingStrategy, Route, RouterModule, Routes} from '@angular/router';
import {Observable, of} from 'rxjs';
import {DashboardComponent} from './dashboard/dashboard.component';

class SelectedPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: Function): Observable<any> {
    return route.data && route.data['preload'] ? load() : of(null);
  }
}

function createRouting(): Routes {
  return [
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
          loadChildren: () => import('./wizard/module').then(m => m.WizardModule),
        },
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
          loadChildren: () => import('./cluster/module').then(m => m.ClusterModule),
        },
        {
          path: 'account',
          loadChildren: () => import('./settings/user/user-settings.module').then(m => m.UserSettingsModule),
          data: {preload: true},
        },
        {
          path: 'settings',
          loadChildren: () => import('./settings/admin/module').then(m => m.AdminSettingsModule),
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
