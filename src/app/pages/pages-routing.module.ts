import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '../core/services';

import {ApiDocsComponent} from './api-docs/api-docs.component';
import {FrontpageComponent} from './frontpage/frontpage.component';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {TermsOfServiceComponent} from './terms-of-service/terms-of-service.component';

const routes: Routes = [
  {
    path: '',
    component: FrontpageComponent,
    pathMatch: 'full',
  },
  {
    path: 'terms-of-service',
    component: TermsOfServiceComponent,
  },
  {
    path: 'rest-api',
    component: ApiDocsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '404',
    component: PageNotFoundComponent,
  },
  {
    path: '**',
    redirectTo: '404',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
