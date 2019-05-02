import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../core/services/auth/auth.guard';
import {ServiceAccountComponent} from '../serviceaccount/serviceaccount.component';

const routes: Routes = [
  {
    path: '',
    component: ServiceAccountComponent,
    canActivate: [AuthGuard],
    data: {title: 'Service Accounts'},
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ServiceAccountRoutingModule {
}
