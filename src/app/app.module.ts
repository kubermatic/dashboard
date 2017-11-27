import { StoreModule } from '@ngrx/store';
import { NgModule } from '@angular/core';
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { KubermaticComponent } from "./kubermatic.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { AWSAddNodeFormComponent } from "./forms/add-node/aws/aws-add-node.component";
import { DigitaloceanAddNodeComponent } from "./forms/add-node/digitalocean/digitalocean-add-node.component";
import { OpenstackAddNodeComponent } from "./forms/add-node/openstack/openstack-add-node.component";
import { MobileNavigationComponent } from './overlays';

import { AppRoutingModule } from "./app-routing.module";
import { SharedModule } from './shared/shared.module';
import { CoreModule } from 'app/core/core.module';
import { combinedReducer } from "./redux/reducers/index";


@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    StoreModule.provideStore(combinedReducer),
  ],
  declarations: [
    KubermaticComponent,
    DashboardComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    MobileNavigationComponent,
  ],
  entryComponents: [
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    MobileNavigationComponent
  ],
  providers: [],
  bootstrap: [KubermaticComponent]
})

export class AppModule { }
