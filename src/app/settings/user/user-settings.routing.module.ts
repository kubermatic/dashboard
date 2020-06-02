import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../../core/services';

import {UserSettingsComponent} from './user-settings.component';

const routes: Routes = [
  {
    path: '',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('../../theming/module').then(module => module.ThemingModule),
        data: {preload: true},
      },
    ],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class UserSettingsRoutingModule {}
