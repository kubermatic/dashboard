// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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
import {RouterModule, Routes} from '@angular/router';
import {DynamicModule} from '@app/dynamic/module-registry';
import {AuthGuard} from '@core/services/auth/guard';
import {AdminSettingsComponent} from './component';

const routes: Routes = [
  {
    path: '',
    component: AdminSettingsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'defaults',
        pathMatch: 'full',
      },
      {
        path: 'limits',
        loadChildren: () => import('./limits/module').then(m => m.AdminSettingsLimitsModule),
      },
      {
        path: 'administrators',
        loadChildren: () => import('./admins/module').then(m => m.AdministratorsModule),
      },
      {
        path: 'globalviewers',
        loadChildren: () => import('./global-viewer/module').then(m => m.GlobalViewerModule),
      },
      {
        path: 'customization',
        loadChildren: () => import('./customization/module').then(m => m.AdminSettingsCustomizationModule),
      },
      {
        path: 'defaults',
        loadChildren: () => import('./defaults/module').then(m => m.AdminSettingsDefaultsModule),
      },
      {
        path: 'announcements',
        loadChildren: () => import('./announcements/module').then(m => m.AdminSettingsAnnouncementsModule),
      },
      {
        path: 'datacenters',
        loadChildren: () => import('./dynamic-datacenters/module').then(m => m.AdminSettingsDatacentersModule),
      },
      {
        path: 'presets',
        loadChildren: () => import('./presets/module').then(m => m.AdminSettingsPresetsModule),
      },
      {
        path: 'seeds',
        loadChildren: () => import('./seed-configurations/module').then(m => m.AdminSettingsSeedConfigurationsModule),
      },
      {
        path: 'opa',
        loadChildren: () => import('./opa/module').then(m => m.AdminSettingsOPAModule),
      },
      {
        path: 'kyvernopolicies',
        loadChildren: () => DynamicModule.KyvernoPolicies,
      },
      {
        path: 'backupdestinations',
        loadChildren: () => import('./bucket-settings/module').then(m => m.AdminSettingsBucketSettingsModule),
      },
      {
        path: 'accounts',
        loadChildren: () => import('./accounts/module').then(m => m.AccountsModule),
      },
      {
        path: 'applications',
        loadChildren: () => import('./applications/module').then(m => m.ApplicationsModule),
      },
      {
        path: 'metering',
        loadChildren: () => DynamicModule.Metering,
        data: {preload: true},
      },
      {
        path: 'rulegroups',
        loadChildren: () => import('./rule-groups/module').then(m => m.AdminSettingsRuleGroupsModule),
      },
      {
        path: 'quotas',
        loadChildren: () => DynamicModule.Quotas,
      },
    ],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class AdminSettingsRoutingModule {}
