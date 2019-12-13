import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../../core/services';

import {UserSettingsComponent} from './user-settings.component';

const routes: Routes = [
  {
    path: '',
    component: UserSettingsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class UserSettingsRoutingModule {
}
