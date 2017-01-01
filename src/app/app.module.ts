import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { RouterModule } from "@angular/router";

import { KubermaticComponent } from "./kubermatic.component";
import { NavigationComponent } from "./navigation/navigation.component";
import { FrontpageComponent } from "./frontpage/frontpage.component";

import { Auth } from "./auth/auth.service";
import { appRoutes } from "./app.routing";
import { AUTH_PROVIDERS } from "./auth/auth.provider";
import { AuthGuard } from "./auth/auth.guard";
import { CustomFormsModule } from "ng2-validation";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { BreadcrumbsComponent } from "./breadcrumbs/breadcrumbs.component";
import { ApiService } from "./api/api.service";
import { WizardComponent } from "./wizard/wizard.component";
import { ClusterNameGenerator } from "./util/name-generator.service";
import { StoreModule } from "@ngrx/store";
import { combinedReducer } from "./reducers/index";

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    CustomFormsModule,
    StoreModule.provideStore(combinedReducer)
  ],
  declarations: [
    KubermaticComponent,
    NavigationComponent,
    FrontpageComponent,
    DashboardComponent,
    BreadcrumbsComponent,
    WizardComponent
  ],
  providers: [
    AUTH_PROVIDERS,
    Auth,
    ApiService,
    AuthGuard,
    ClusterNameGenerator
  ],
  bootstrap: [KubermaticComponent]
})
export class AppModule { }
