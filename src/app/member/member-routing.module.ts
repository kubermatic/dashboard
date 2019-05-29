import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard, AuthzGuard} from '../core/services';
import {MemberComponent} from './member.component';

const routes: Routes = [
  {
    path: '',
    component: MemberComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MemberRoutingModule {
}
