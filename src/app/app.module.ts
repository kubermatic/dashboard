import {NgReduxFormModule} from '@angular-redux/form';
import {NgReduxModule} from '@angular-redux/store';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MAT_TOOLTIP_DEFAULT_OPTIONS, MatFormFieldDefaultOptions} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';

import {kmTooltipDefaultOptions} from '../app-config';
import {environment} from '../environments/environment';

import {AppConfigService} from './app-config.service';
import {AppRoutingModule} from './app-routing.module';
import {CoreModule} from './core/core.module';
import {ProjectService, UserService} from './core/services';
import {DashboardComponent} from './dashboard/dashboard.component';
import {GoogleAnalyticsService} from './google-analytics.service';
import {KubermaticComponent} from './kubermatic.component';
import {AddMemberComponent} from './member/add-member/add-member.component';
import {EditMemberComponent} from './member/edit-member/edit-member.component';
import {AddServiceAccountComponent} from './serviceaccount/add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from './serviceaccount/edit-serviceaccount/edit-serviceaccount.component';
import {AddServiceAccountTokenComponent} from './serviceaccount/serviceaccount-token/add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from './serviceaccount/serviceaccount-token/edit-serviceaccount-token/edit-serviceaccount-token.component';
import {TokenDialogComponent} from './serviceaccount/serviceaccount-token/token-dialog/token-dialog.component';
import {SharedModule} from './shared/shared.module';

const appInitializerFn = (appConfig: AppConfigService): Function => {
  return () => appConfig.loadAppConfig()
                   .then(() => appConfig.loadUserGroupConfig())
                   .then(() => appConfig.loadGitVersion())
                   .then(() => appConfig.checkCustomCSS());
};

const appearance: MatFormFieldDefaultOptions = {
  appearance: 'outline'
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    BrowserModule,
    environment.animations ? BrowserAnimationsModule : NoopAnimationsModule,
    AppRoutingModule,
    NgReduxFormModule,
    NgReduxModule,
    RouterModule,
  ],
  declarations: [
    KubermaticComponent,
    DashboardComponent,
  ],
  providers: [
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService],
    },
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: kmTooltipDefaultOptions,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: appearance,
    },
    CookieService,
    ProjectService,
    UserService,
    GoogleAnalyticsService,
  ],
  entryComponents: [
    AddMemberComponent,
    EditMemberComponent,
    AddServiceAccountComponent,
    EditServiceAccountComponent,
    AddServiceAccountTokenComponent,
    EditServiceAccountTokenComponent,
    TokenDialogComponent,
  ],
  bootstrap: [KubermaticComponent],
})

export class AppModule {
}
