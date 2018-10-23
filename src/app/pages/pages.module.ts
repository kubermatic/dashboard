import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from '../pages/page-not-found/page-not-found.component';
import { FrontpageComponent } from '../pages/frontpage/frontpage.component';
import { TermsOfServiceComponent } from '../pages/terms-of-service/terms-of-service.component';

import { ParticlesModule } from 'angular-particle';
import { PagesRoutingModule } from './pages-routing.module';
import { SharedModule } from './../shared/shared.module';

@NgModule({
  imports: [
    PagesRoutingModule,
    ParticlesModule,
    SharedModule
  ],
  declarations: [
    PageNotFoundComponent,
    FrontpageComponent,
    TermsOfServiceComponent
  ],
  exports: []
})

export class PagesModule {
}
