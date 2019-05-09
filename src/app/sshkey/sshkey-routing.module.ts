import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../core/services';
import {SSHKeyComponent} from './sshkey.component';

const routes: Routes = [
  {
    path: '',
    component: SSHKeyComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SSHKeyRoutingModule {
}
