import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {BrowserModule} from "@angular/platform-browser";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, BrowserXhr} from "@angular/http";


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
  MdDialogModule,
  MdSliderModule,
  OverlayModule,
  MdSlideToggleModule,
  MdProgressBarModule
} from '@angular/material';

import 'hammerjs';
import {FlexLayoutModule} from "@angular/flex-layout";
import {KubermaticComponent} from "./kubermatic.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {WizardComponent} from "./wizard/wizard.component";
import {ClusterComponent} from "./cluster/cluster.component";
import {AddSshKeyComponent} from "./sshkey/add-ssh-key/add-ssh-key.component";
import {ClusterListComponent} from "./cluster-list/cluster-list.component";
import {ClusterItemComponent} from "./cluster-list/cluster-item/cluster-item.component";
import {NodeComponent} from "./cluster/node/node.component";
import {NodeDeleteConfirmationComponent} from "./cluster/node-delete-confirmation/node-delete-confirmation.component";
import {NodeDeleteConfirmationService} from "./cluster/node-delete-confirmation/node-delete-confirmation.service";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";
import {SshkeyComponent} from "./sshkey/sshkey.component";
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
import {ListSshKeyComponent} from './sshkey/list-ssh-key/list-ssh-key.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { SidenavService } from './sidenav/sidenav.service';
import { AddSshKeyModalComponent } from './wizard/add-ssh-key-modal/add-ssh-key-modal.component';
import { ClusterHealthStatusComponent } from './cluster-health-status/cluster-health-status.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { SshKeyFormFieldComponent } from './wizard/ssh-key-form-field/ssh-key-form-field.component';
import {HttpClientModule} from "@angular/common/http";
import {AWSAddNodeFormComponent} from "./forms/add-node/aws/aws-add-node.component";
import {DigitaloceanAddNodeComponent} from "./forms/add-node/digitalocean/digitalocean-add-node.component";
import {OpenstackAddNodeComponent} from "./forms/add-node/openstack/openstack-add-node.component";
import {AddNodeComponent} from "./forms/add-node/add-node.component";
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import { ClipboardModule } from 'ngx-clipboard';
import { ProgressComponent } from './wizard/progress/progress.component';
import { ProviderComponent } from './wizard/provider/provider.component';
import { DatacenterComponent } from './wizard/datacenter/datacenter.component';
import { ClusterNameComponent } from './wizard/cluster-name/cluster-name.component';
import { UpgradeClusterComponent } from './cluster/upgrade-cluster/upgrade-cluster.component';
import { CustomEventService, CreateNodesService, LocalStorageService, InputValidationService } from './services';
import { CheckTokenInterceptor, LoaderInterceptor, ErrorNotificationsInterceptor } from './interceptors';
import { MobileNavigationComponent } from './overlays';

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule,
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
    MdSliderModule,
    OverlayModule,
    MdSlideToggleModule,
    MdProgressBarModule,
    ClipboardModule
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
    SshkeyComponent,
    NotificationComponent,
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    AddSshKeyComponent,
    ListSshKeyComponent,
    SidenavComponent,
    AddSshKeyModalComponent,
    ClusterHealthStatusComponent,
    PageNotFoundComponent,
    SshKeyFormFieldComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    ProgressComponent,
    ProviderComponent,
    DatacenterComponent,
    ClusterNameComponent,
    UpgradeClusterComponent,
    MobileNavigationComponent
  ],
  exports: [
    RouterModule,
    CommonModule,
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
    MdSliderModule,
    OverlayModule
  ],
  entryComponents: [
    ClusterDeleteConfirmationComponent,
    NodeDeleteConfirmationComponent,
    AddSshKeyModalComponent,
    AWSAddNodeFormComponent,
    DigitaloceanAddNodeComponent,
    OpenstackAddNodeComponent,
    UpgradeClusterComponent,
    MobileNavigationComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    Auth,
    ApiService,
    AuthGuard,
    ClusterNameGenerator,
    SidenavService,
    NodeDeleteConfirmationService,
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorNotificationsInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CheckTokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoaderInterceptor,
      multi: true
    },
    CustomEventService,
    CreateNodesService,
    LocalStorageService,
    InputValidationService
  ],
  bootstrap: [KubermaticComponent]

})

export class AppModule { }
