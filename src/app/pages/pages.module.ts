
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from 'app/pages/page-not-found/page-not-found.component';
import { FrontpageComponent } from 'app/pages/frontpage/frontpage.component';
import { PagesRoutingModule } from './pages-routing.module';

@NgModule({
    imports: [PagesRoutingModule],
    declarations: [
        PageNotFoundComponent,
        FrontpageComponent
    ],
    exports: []
})

export class PagesModule { }
