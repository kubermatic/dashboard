import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard, AuthzGuard} from '../core/services/auth/auth.guard';
import {ServiceAccountComponent} from '../serviceaccount/serviceaccount.component';

const routes: Routes = [
  {
    path: '',
    component: ServiceAccountComponent,
    canActivate: [AuthGuard, AuthzGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServiceAccountRoutingModule {
}
