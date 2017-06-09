import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {BrowserModule} from "@angular/platform-browser";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, Http, BrowserXhr} from "@angular/http";

//import { MaterialModule } from './material.module';

import {
  MdButtonModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSnackBarModule,
  MdToolbarModule,
  MdTooltipModule,
  MdSelectModule,
  MdCheckboxModule,
  MdMenuModule,
  MdCardModule,
  MdDialogModule, MdSliderModule

} from '@angular/material';

import 'hammerjs';
import {FlexLayoutModule} from "@angular/flex-layout";
import {KubermaticComponent} from "./kubermatic.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {AddSshKeyComponent} from "./profile/add-ssh-key/add-ssh-key.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {ClusterItemComponent} from "./cluster-list/cluster-item/cluster-item.component";
import {NodeComponent} from "./cluster/node/node.component";
import {AddNodeComponent} from "./cluster/add-node/add-node.component";
import {NodeDeleteConfirmationComponent} from "./cluster/node-delete-confirmation/node-delete-confirmation.component";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";
import {ProfileComponent} from "./profile/profile.component";
import {NotificationComponent} from "./notification/notification.component";
import {Auth} from "./auth/auth.service";
import {appRoutes} from "./app.routing";
import {AUTH_PROVIDERS} from "./auth/auth.provider";
import {AuthGuard} from "./auth/auth.guard";
import {CustomFormsModule} from "ng2-validation";
import {ApiService} from "./api/api.service";
import {ClusterNameGenerator} from "./util/name-generator.service";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "./reducers/index";
import {SimpleNotificationsModule} from "angular2-notifications";
import {SlimLoadingBarModule} from "ng2-slim-loading-bar";
import {ProgressBrowserXhr} from "./util/ProgressBrowserXhr";
import {ClusterDeleteConfirmationComponent} from "./cluster/cluster-delete-confirmation/cluster-delete-confirmation.component";
import {ListSshKeyComponent} from './profile/list-ssh-key/list-ssh-key.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { SidenavService } from './sidenav/sidenav.service';
import { AddSshKeyModalComponent } from './wizard/add-ssh-key-modal/add-ssh-key-modal.component';
/*
 import { CommonModule } from '@angular/common';
 import { BrowserModule } from '@angular/platform-browser';
 import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
 import { RouterModule } from '@angular/router';
 import { FormsModule } from '@angular/forms';
 import { HttpModule } from '@angular/http';
 import { NgModule } from '@angular/core';
 import { FlexLayoutModule } from '@angular/flex-layout';
 import { MomentModule } from 'angular2-moment';
 import { Ng2Webstorage } from 'ng2-webstorage';

 import 'hammerjs';

 import { Directives } from './directives/';
 import { Services } from './services/';
 import { Guards } from './guards/';
 import { TranslationModule } from './translation/translation.module';
 import { MaterialModule } from './modules/material.module';
 */

/*

 "@angular/animations": "^4.0.1",
 "@angular/common": "~4.0.0",
 "@angular/compiler": "~4.0.0",
 "@angular/core": "~4.0.0",
 "@angular/forms": "~4.0.0",
 "@angular/http": "~4.0.0",
 "@angular/material": "^2.0.0-beta.3",
 "@angular/platform-browser": "~4.0.0",
 "@angular/platform-browser-dynamic": "~4.0.0",
 "@angular/router": "~4.0.0",
 "": "^1.0.0-alpha.22",
 "angular-in-memory-web-api": "~0.3.0",
 "angular2-cookie": "^1.2.6",
 "angular2-toaster": "^3.0.1",
 "core-js": "^2.4.1",
 "hammerjs": "^2.0.8",
 "moment": "^2.18.1",
 "rxjs": "5.0.1",
 "systemjs": "0.19.40",
 "zone.js": "^0.8.4"

 */

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    CustomFormsModule,
    StoreModule.provideStore(combinedReducer),
    SimpleNotificationsModule.forRoot(),
    SlimLoadingBarModule.forRoot(),
    FlexLayoutModule,

    FormsModule,
    ReactiveFormsModule,



  MdButtonModule,
  MdIconModule,
  MdInputModule,
  MdListModule,
  MdProgressSpinnerModule,
  MdSidenavModule,
  MdSnackBarModule,
  MdToolbarModule,
  MdTooltipModule,
  MdSelectModule,
  MdCheckboxModule,
  MdMenuModule,
  MdCardModule,
    MdDialogModule,
    MdSliderModule


  ],
  declarations: [
    KubermaticComponent,
    NavigationComponent,
    FrontpageComponent,
    DashboardComponent,
    BreadcrumbsComponent,
    WizardComponent,
    ClusterComponent,
    ClusterListComponent,
    ClusterItemComponent,
    NodeComponent,
    AddNodeComponent,
    ProfileComponent,
    NotificationComponent,
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    AddSshKeyComponent,
    ListSshKeyComponent,
    SidenavComponent,
    AddSshKeyModalComponent
  ],
  exports: [
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,

    MdButtonModule,
    MdIconModule,
    MdInputModule,
    MdListModule,
    MdProgressSpinnerModule,
    MdSidenavModule,
    MdSnackBarModule,
    MdToolbarModule,
    MdTooltipModule,
    MdSelectModule,
    MdCheckboxModule,
    MdMenuModule,
    MdCardModule,
    MdSliderModule
  ],
  entryComponents: [
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    AddSshKeyModalComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    Auth,
    ApiService,
    AuthGuard,
    ClusterNameGenerator,
    SidenavService,
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr
    }
  ],
  bootstrap: [KubermaticComponent]
})


export class AppModule { }
