import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../../core/services';

import {UserSettingsComponent} from './user-settings.component';
import {environment} from '../../../environments/environment';

const routes: Routes = [
  {
    path: '',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import(`../../dynamic/${environment.edition}/theming/module`).then(module => module.ThemingModule),
        data: {preload: true},
      },
    ],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class UserSettingsRoutingModule {}
