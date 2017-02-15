import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {BrowserModule} from "@angular/platform-browser";

import {KubermaticComponent} from "./kubermatic.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {FrontpageComponent} from "./frontpage/frontpage.component";
import {BreadcrumbsComponent} from "./breadcrumbs/breadcrumbs.component";
import {NotificationComponent} from "./notification/notification.component";

import {Auth} from "./auth/auth.service";
import {appRootRoutes} from "./app.routing";
import {AUTH_PROVIDERS} from "./auth/auth.provider";
import {AuthGuard} from "./auth/auth.guard";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "./reducers/index";
import {SimpleNotificationsModule} from "angular2-notifications";
import {SlimLoadingBarModule} from "ng2-slim-loading-bar";

@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    RouterModule.forRoot(appRootRoutes),
    StoreModule.provideStore(combinedReducer),
    SimpleNotificationsModule,
    SlimLoadingBarModule.forRoot()
  ],
  declarations: [
    KubermaticComponent,
    NavigationComponent,
    FrontpageComponent,
    BreadcrumbsComponent,
    NotificationComponent,
  ],
  providers: [
    AUTH_PROVIDERS,
    Auth,
    AuthGuard,
  ],
  bootstrap: [KubermaticComponent]
})
export class AppModule { }
