import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './../core/services/auth/auth.guard';

import { SshkeyComponent } from './sshkey.component';

const routes: Routes = [
  {
    path: '',
    component: SshkeyComponent,
    canActivate: [AuthGuard],
    data: { title: 'Manage SSH keys' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SshkeyRoutingModule {
}
