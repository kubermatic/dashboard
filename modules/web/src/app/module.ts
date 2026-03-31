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

import {inject, NgModule, provideAppInitializer, provideZoneChangeDetection} from '@angular/core';
import {MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS} from '@angular/material/button-toggle';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldDefaultOptions} from '@angular/material/form-field';
import {MAT_TOOLTIP_DEFAULT_OPTIONS} from '@angular/material/tooltip';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule, NoopAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {CoreModule} from '@core/module';
import {DatacenterService} from '@core/services/datacenter';
import {HistoryService} from '@core/services/history';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {environment} from '@environments/environment';
import {SharedModule} from '@shared/module';
import {CookieService} from 'ngx-cookie-service';
import {MonacoEditorModule} from 'ngx-monaco-editor-v2';
import {kmButtonToggleDefaultOptions, kmTooltipDefaultOptions} from '../app-config';
import {KubermaticComponent} from './component';
import {Auth} from '@core/services/auth/service';
import {BrandingService} from '@core/services/branding';
import {AppConfigService} from './config.service';
import {DashboardComponent} from './dashboard/component';
import {GoogleAnalyticsService} from './google-analytics.service';
import {AppRoutingModule} from './routing';

const appInitializerFn = (): Promise<void> => {
  const appConfigService = inject(AppConfigService);
  const historyService = inject(HistoryService);
  const userService = inject(UserService);
  const datacenterService = inject(DatacenterService);
  const brandingService = inject(BrandingService);
  const authService = inject(Auth)

  historyService.init();
  return authService.init().then(() => {
    userService.init();
    datacenterService.init();
    return appConfigService
      .loadAppConfig()
      .then(() => appConfigService.loadUserGroupConfig())
      .then(() => appConfigService.loadGitVersion())
      .then(() => {
        brandingService.init(appConfigService.getConfig().branding);
      });
  })
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
    provideZoneChangeDetection({eventCoalescing: true}),
    provideAppInitializer(appInitializerFn),
    {
      provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
      useValue: kmTooltipDefaultOptions,
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: appearance,
    },
    {
      provide: MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS,
      useValue: kmButtonToggleDefaultOptions,
    },
    AppConfigService,
    CookieService,
    ProjectService,
    UserService,
    GoogleAnalyticsService,
  ],
  bootstrap: [KubermaticComponent],
})
export class AppModule {}
