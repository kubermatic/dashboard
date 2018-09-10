import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './../core/services/auth/auth.guard';

import { SSHKeyComponent } from '../sshkey/sshkey.component';

const routes: Routes = [
  {
    path: ':projectID',
    component: SSHKeyComponent,
    canActivate: [AuthGuard],
    data: { title: 'Manage SSH keys' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SSHKeyRoutingModule {
}
