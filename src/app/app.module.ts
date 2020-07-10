// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {APP_INITIALIZER, NgModule} from '@angular/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions} from '@angular/material/form-field';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';

import {kmTooltipDefaultOptions} from '../app-config';
import {environment} from '../environments/environment';

import {AppConfigService} from './app-config.service';
import {AppRoutingModule} from './app-routing.module';
import {CoreModule} from './core/core.module';
import {DatacenterService, ProjectService, UserService} from './core/services';
import {HistoryService} from './core/services/history/history.service';
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
import {MonacoEditorModule} from 'ngx-monaco-editor';

const appInitializerFn = (
  appConfigService: AppConfigService,
  historyService: HistoryService,
  userServuce: UserService,
  datacenterService: DatacenterService
): Function => {
  return () => {
    historyService.init();
    userServuce.init();
    datacenterService.init();
    return appConfigService
      .loadAppConfig()
      .then(() => appConfigService.loadUserGroupConfig())
      .then(() => appConfigService.loadGitVersion());
  };
};

const appearance: MatFormFieldDefaultOptions = {
  appearance: 'outline',
};

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    BrowserModule,
    environment.animations ? BrowserAnimationsModule : NoopAnimationsModule,
    MonacoEditorModule.forRoot(),
    AppRoutingModule,
    RouterModule,
  ],
  declarations: [KubermaticComponent, DashboardComponent],
  providers: [
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigService, HistoryService, UserService, DatacenterService],
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
export class AppModule {}
