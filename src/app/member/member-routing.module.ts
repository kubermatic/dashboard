import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../core/services';
import {MemberComponent} from './member.component';

const routes: Routes = [
  {
    path: '',
    component: MemberComponent,
    canActivate: [AuthGuard],
    data: {title: 'Manage Members'},
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MemberRoutingModule {
}
