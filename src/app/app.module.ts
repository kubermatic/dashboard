import { NgModule } from '@angular/core';
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxModule } from '@angular-redux/store';
import { NgReduxFormModule } from '@angular-redux/form';

import { KubermaticComponent } from "./kubermatic.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { MobileNavigationComponent } from './overlays';

import { AppRoutingModule } from "./app-routing.module";
import { SharedModule } from './shared/shared.module';
import { CoreModule } from 'app/core/core.module';



@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    NgReduxFormModule,
    NgReduxModule
  ],
  declarations: [
    KubermaticComponent,
    DashboardComponent,
    MobileNavigationComponent,
  ],
  entryComponents: [
    MobileNavigationComponent
  ],
  providers: [],
  bootstrap: [KubermaticComponent]
})

export class AppModule { }
