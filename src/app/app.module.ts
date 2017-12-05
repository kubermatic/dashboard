import { NgModule } from '@angular/core';
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxModule } from '@angular-redux/store';
import { NgReduxFormModule } from '@angular-redux/form';

import { KubermaticComponent } from "./kubermatic.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { AWSAddNodeFormComponent } from "./forms/add-node/aws/aws-add-node.component";
import { DigitaloceanAddNodeComponent } from "./forms/add-node/digitalocean/digitalocean-add-node.component";
import { OpenstackAddNodeComponent } from "./forms/add-node/openstack/openstack-add-node.component";
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
