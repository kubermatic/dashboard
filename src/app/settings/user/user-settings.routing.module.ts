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
import {getEditionDirName} from '@app/dynamic/common';
import {AuthGuard} from '@core/services/auth/guard';
import {UserSettingsComponent} from './user-settings.component';

const routes: Routes = [
  {
    path: '',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import(`../../dynamic/${getEditionDirName()}/theming/module`).then(module => module.ThemingModule),
        data: {preload: true},
      },
    ],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class UserSettingsRoutingModule {}
