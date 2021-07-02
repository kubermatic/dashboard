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
import {RouterModule, Routes} from '@angular/router';
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
        path: 'administrators',
        loadChildren: () => import('./admins/module').then(m => m.AdministratorsModule),
      },
      {
        path: 'interface',
        loadChildren: () => import('./interface/module').then(m => m.AdminSettingsInterfaceModule),
      },
      {
        path: 'defaults',
        loadChildren: () => import('./defaults/module').then(m => m.AdminSettingsDefaultsModule),
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
        path: 'opa',
        loadChildren: () => import('./constraint-templates/module').then(m => m.AdminSettingsOPAModule),
      },
    ],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class AdminSettingsRoutingModule {}
