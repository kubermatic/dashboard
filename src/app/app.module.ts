import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from "@angular/router';

import { KubermaticComponent } from './kubermatic.component';
import { NavigationComponent } from './navigation/navigation.component';
import { FrontpageComponent } from './frontpage/frontpage.component';

import { Auth } from './auth/auth.service';
import { appRoutes } from './app.routing';
import { AUTH_PROVIDERS } from 'angular2-jwt';
import { AuthGuard } from './auth/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
import {GlobalState} from './global.state';
import {ApiService} from './api/api.service';

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
    DashboardComponent,
    BreadcrumbsComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    Auth,
    ApiService,
    AuthGuard,
    GlobalState
  ],
  bootstrap: [KubermaticComponent]
})
export class AppModule { }
