import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from 'app/pages/page-not-found/page-not-found.component';
import { FrontpageComponent } from 'app/pages/frontpage/frontpage.component';

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
        FrontpageComponent
    ],
    exports: []
})

export class PagesModule { }
