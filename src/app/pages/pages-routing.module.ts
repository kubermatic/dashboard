import { NgModule } from '@angular/core';
import { Routes, RouterModule } from "@angular/router";

import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { FrontpageComponent } from './frontpage/frontpage.component';

const routes: Routes = [
    {
        path: "",
        component: FrontpageComponent,
        pathMatch: 'full'
    },
    {
        path: "404",
        component: PageNotFoundComponent
    },
    {
        path: "**",
        redirectTo: "404"
    },
];


@NgModule({
    imports: [ RouterModule.forChild(routes) ],
    exports: [ RouterModule ]
})
export class PagesRoutingModule {}