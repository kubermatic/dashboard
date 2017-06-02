import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {BrowserModule} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, BrowserXhr} from "@angular/http";
import {MaterialModule} from '@angular/material';
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


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    CustomFormsModule,
    StoreModule.provideStore(combinedReducer),
    SimpleNotificationsModule.forRoot(),
    SlimLoadingBarModule.forRoot(),
    MaterialModule,
    FlexLayoutModule
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


  //['ngMaterial']


export class AppModule { }
