import {NgModule} from '@angular/core';
import {ParticlesModule} from 'angular-particle';

import {FrontpageComponent} from '../pages/frontpage/frontpage.component';
import {PageNotFoundComponent} from '../pages/page-not-found/page-not-found.component';
import {TermsOfServiceComponent} from '../pages/terms-of-service/terms-of-service.component';
import {SharedModule} from '../shared/shared.module';

import {ApiDocsComponent} from './api-docs/api-docs.component';
import {PagesRoutingModule} from './pages-routing.module';

@NgModule({
  imports: [
    PagesRoutingModule,
    ParticlesModule,
    SharedModule,
  ],
  declarations: [
    PageNotFoundComponent,
    FrontpageComponent,
    TermsOfServiceComponent,
    ApiDocsComponent,
  ],
  exports: [],
})

export class PagesModule {
}
