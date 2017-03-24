import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
//import {RouterModule} from "@angular/router";

import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, BrowserXhr} from "@angular/http";
//import {appChildRoutes} from "../app.routing";
import {CustomFormsModule} from "ng2-validation";

import {WizardComponent} from "../wizard/wizard.component";
import {ClusterComponent} from "../cluster/cluster.component";
import {ClusterListComponent} from "../cluster-list/cluster-list.component";
import {ClusterItemComponent} from "../cluster-list/cluster-item/cluster-item.component";
import {NodeComponent} from "../cluster/node/node.component";
import {ProfileComponent} from "../profile/profile.component";
import {ApiService} from "../api/api.service";
import {AuthGuard} from "../auth/auth.guard";
import {Auth} from "../auth/auth.service";

import {ClusterNameGenerator} from "../util/name-generator.service";
import {ProgressBrowserXhr} from "../util/ProgressBrowserXhr";
import {DashboardComponent} from "./dashboard.component";

@NgModule({
  imports: [
    CommonModule,
    //RouterModule.forChild(appChildRoutes),
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    CustomFormsModule
  ],
  declarations: [
    DashboardComponent,
    WizardComponent,
    ClusterComponent,
    ClusterListComponent,
    NodeComponent,
    ClusterItemComponent,
    ProfileComponent,
  ],
  providers: [
    Auth,
    AuthGuard,
    ApiService,
    ClusterNameGenerator,
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr
    }
  ]
})
export class DashboardModule {
}
