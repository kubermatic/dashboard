import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './../core/services/auth/auth.guard';

import { WizardComponent } from '../wizard/wizard.component';

const routes: Routes = [
  {
    path: '',
    component: WizardComponent,
    canActivate: [AuthGuard],
    data: { title: 'Create Cluster with Nodes' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WizardRoutingModule {
}
