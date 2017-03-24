import {BrowserModule} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, BrowserXhr} from "@angular/http";
import {RouterModule} from "@angular/router";
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
import {NodeDeleteConfirmationComponent} from "./cluster/node-delete-confirmation/node-delete-confirmation.component"
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
import { ListSshKeyComponent } from './profile/list-ssh-key/list-ssh-key.component';


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
    SimpleNotificationsModule,
    SlimLoadingBarModule.forRoot()
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
    NodeDeleteConfirmationComponent,
    AddSshKeyComponent,
    ListSshKeyComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    Auth,
    ApiService,
    AuthGuard,
    ClusterNameGenerator,
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr
    }
  ],
  bootstrap: [KubermaticComponent]
})
export class AppModule { }
