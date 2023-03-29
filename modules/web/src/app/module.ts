// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {APP_INITIALIZER, NgModule} from '@angular/core';
import {
  MAT_LEGACY_FORM_FIELD_DEFAULT_OPTIONS as MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatLegacyFormFieldDefaultOptions as MatFormFieldDefaultOptions,
} from '@angular/material/legacy-form-field';
import {MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS} from '@angular/material/legacy-tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {CoreModule} from '@core/module';
import {ChangelogService} from '@core/services/changelog';
import {DatacenterService} from '@core/services/datacenter';
import {HistoryService} from '@core/services/history';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {environment} from '@environments/environment';
import {CookieService} from 'ngx-cookie-service';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {kmTooltipDefaultOptions} from '../app-config';
import {KubermaticComponent} from './component';
import {AppConfigService} from './config.service';
import {DashboardComponent} from './dashboard/component';
import {GoogleAnalyticsService} from './google-analytics.service';
import {AppRoutingModule} from './routing';

const appInitializerFn = (
  appConfigService: AppConfigService,
  historyService: HistoryService,
  userService: UserService,
  datacenterService: DatacenterService,
  changelogService: ChangelogService
): Function => {
  return () => {
    historyService.init();
    userService.init();
    datacenterService.init();
    changelogService.init();
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
      deps: [AppConfigService, HistoryService, UserService, DatacenterService, ChangelogService],
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
  bootstrap: [KubermaticComponent],
})
export class AppModule {}
