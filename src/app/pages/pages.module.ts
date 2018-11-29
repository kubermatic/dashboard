import {NgModule} from '@angular/core';
import {ParticlesModule} from 'angular-particle';
import {FrontpageComponent} from '../pages/frontpage/frontpage.component';
import {PageNotFoundComponent} from '../pages/page-not-found/page-not-found.component';
import {TermsOfServiceComponent} from '../pages/terms-of-service/terms-of-service.component';
import {SharedModule} from '../shared/shared.module';
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
  ],
  exports: [],
})

export class PagesModule {
}
