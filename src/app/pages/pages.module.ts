import {NgModule} from '@angular/core';

import {SharedModule} from '../shared/shared.module';

import {ApiDocsComponent} from './api-docs/api-docs.component';
import {FrontpageComponent} from './frontpage/frontpage.component';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {PagesRoutingModule} from './pages-routing.module';
import {TermsOfServiceComponent} from './terms-of-service/terms-of-service.component';

@NgModule({
  imports: [
    PagesRoutingModule,
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
