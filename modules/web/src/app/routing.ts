// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {NgModule} from '@angular/core';
import {PreloadingStrategy, Route, RouterModule, Routes} from '@angular/router';
import {AdminGuard} from '@core/services/auth/guard';
import {Observable, of} from 'rxjs';
import {DashboardComponent} from './dashboard/component';
import {DynamicModule} from './dynamic/module-registry';
import {View} from './shared/entity/common';

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
          loadChildren: () => import('./project/module').then(m => m.ProjectModule),
        },
        {
          path: 'projects/:projectID/overview',
          loadChildren: () => import('./project-overview/module').then(m => m.ProjectOverviewModule),
        },
        {
          path: 'projects/:projectID/wizard',
          loadChildren: () => import('./wizard/module').then(m => m.WizardModule),
        },
        {
          path: 'projects/:projectID/external-cluster-wizard',
          loadChildren: () => import('./external-cluster-wizard/module').then(m => m.ExternalClusterModule),
        },
        {
          path: 'projects/:projectID/kubeone-wizard',
          loadChildren: () => import('./kubeone-wizard/module').then(m => m.KubeOneWizardModule),
        },
        {
          path: 'projects/:projectID/sshkeys',
          loadChildren: () => import('./sshkey/module').then(m => m.SSHKeyModule),
        },
        {
          path: 'projects/:projectID/members',
          loadChildren: () => import('./member/module').then(m => m.MemberModule),
        },
        {
          path: 'projects/:projectID/groups',
          loadChildren: () => import('./member/module').then(m => m.MemberModule),
        },
        {
          path: 'projects/:projectID/serviceaccounts',
          loadChildren: () => import('./serviceaccount/module').then(m => m.ServiceAccountModule),
        },
        {
          path: 'projects/:projectID/clusters',
          loadChildren: () => import('./cluster/module').then(m => m.ClusterModule),
        },
        {
          path: 'projects/:projectID/externalclusters',
          loadChildren: () => import('./cluster/module').then(m => m.ClusterModule),
        },
        {
          path: 'projects/:projectID/kubeoneclusters',
          loadChildren: () => import('./cluster/module').then(m => m.ClusterModule),
        },
        {
          path: 'projects/:projectID/clustertemplates',
          loadChildren: () => import('./cluster-template/module').then(m => m.ClusterTemplateModule),
        },
        {
          path: 'projects/:projectID/backups',
          loadChildren: () => import('./backup/module').then(m => m.BackupModule),
        },
        {
          path: 'projects/:projectID/snapshots',
          loadChildren: () => import('./backup/module').then(m => m.BackupModule),
        },
        {
          path: 'projects/:projectID/restores',
          loadChildren: () => import('./backup/module').then(m => m.BackupModule),
        },
        {
          path: `projects/:projectID/${View.ClusterBackup}`,
          loadChildren: () => DynamicModule.ClusterBackups,
        },
        {
          path: `projects/:projectID/${View.ClusterRestore}`,
          loadChildren: () => DynamicModule.ClusterBackups,
        },
        {
          path: 'account',
          loadChildren: () => import('./settings/user/module').then(m => m.UserSettingsModule),
          data: {preload: true},
        },
        {
          path: 'settings',
          loadChildren: () => import('./settings/admin/module').then(m => m.AdminSettingsModule),
          canActivate: [AdminGuard],
        },
        {
          path: '',
          loadChildren: () => import('./pages/module').then(m => m.PagesModule),
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
