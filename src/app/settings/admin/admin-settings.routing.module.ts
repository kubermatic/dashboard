import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../../core/services';

import {AdminSettingsComponent} from './admin-settings.component';

const routes: Routes = [
  {
    path: '',
    component: AdminSettingsComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class AdminSettingsRoutingModule {}
