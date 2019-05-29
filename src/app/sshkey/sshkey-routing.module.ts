import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard, AuthzGuard} from '../core/services';
import {SSHKeyComponent} from './sshkey.component';

const routes: Routes = [
  {
    path: '',
    component: SSHKeyComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SSHKeyRoutingModule {
}
