import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from "@angular/router";

import { KubermaticComponent } from './kubermatic.component';
import { NavigationComponent } from './navigation/navigation.component';
import { FrontpageComponent } from './frontpage/frontpage.component';
import { appRoutes } from "./app.routing";
import { FooterComponent } from './footer/footer.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes)
  ],
  declarations: [
    KubermaticComponent,
    NavigationComponent,
    FrontpageComponent,
    FooterComponent
  ],
  providers: [],
  bootstrap: [KubermaticComponent]
})
export class AppModule { }
