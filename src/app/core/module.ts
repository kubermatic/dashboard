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

import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {Injector, NgModule, Optional, SkipSelf} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {ApiService} from '@core/services/api/service';
import {AuthGuard, AuthzGuard} from '@core/services/auth/guard';
import {Auth} from '@core/services/auth/service';
import {ClusterService} from '@core/services/cluster/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {HistoryService} from '@core/services/history/service';
import {LabelService} from '@core/services/label/service';
import {OPAService} from '@core/services/opa/service';
import {ParamsService} from '@core/services/params/service';
import {RBACService} from '@core/services/rbac/service';
import {PresetsService} from '@core/services/wizard/presets.service';
import {SharedModule} from '@shared/shared.module';
import {COOKIE, COOKIE_DI_TOKEN} from '../config';
import {AddMemberComponent} from '../member/add-member/add-member.component';
import {EditMemberComponent} from '../member/edit-member/edit-member.component';
import {AddServiceAccountComponent} from '../serviceaccount/add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from '../serviceaccount/edit-serviceaccount/edit-serviceaccount.component';
import {AddServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/edit-serviceaccount-token/edit-serviceaccount-token.component';
import {FooterComponent} from './components/footer/component';
import {NavigationComponent} from './components/navigation/component';
import {ProjectSelectorComponent} from './components/navigation/project/component';
import {NotificationPanelComponent} from './components/notification-panel/component';
import {SidenavComponent} from './components/sidenav/component';
import {UserPanelComponent} from './components/user-panel/component';
import {AuthInterceptor, CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor} from './interceptors';
import {GlobalModule} from './services/global/module';
import {NameGeneratorService} from './services/name-generator/service';
import {NodeDataService} from './services/node-data/service';
import {PageTitleService} from './services/page-title/service';
import {PreviousRouteService} from './services/previous-route/service';
import {SettingsService} from './services/settings/service';
import {ThemeInformerService} from './services/theme-informer/service';
import {TokenService} from './services/token/service';
import {StepsService} from './services/wizard/steps.service';

const modules: any[] = [
  CommonModule,
  HttpClientModule,
  RouterModule,
  SharedModule,
  GlobalModule,
  BrowserAnimationsModule,
];

const components: any[] = [
  SidenavComponent,
  ProjectSelectorComponent,
  NavigationComponent,
  AddMemberComponent,
  EditMemberComponent,
  AddServiceAccountComponent,
  EditServiceAccountComponent,
  AddServiceAccountTokenComponent,
  EditServiceAccountTokenComponent,
  FooterComponent,
  NotificationPanelComponent,
  UserPanelComponent,
];

const services: any[] = [
  Auth,
  AuthGuard,
  AuthzGuard,
  DatacenterService,
  NodeDataService,
  StepsService,
  NameGeneratorService,
  ApiService,
  ClusterService,
  ParamsService,
  LabelService,
  HistoryService,
  SettingsService,
  RBACService,
  PresetsService,
  PreviousRouteService,
  ThemeInformerService,
  TokenService,
  PageTitleService,
  OPAService,
];

const interceptors: any[] = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorNotificationsInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: CheckTokenInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: LoaderInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
  },
];

@NgModule({
  imports: [...modules],
  declarations: [...components],
  providers: [...services, ...interceptors, {provide: COOKIE_DI_TOKEN, useValue: COOKIE}],
  exports: [...components],
})
export class CoreModule {
  static injector: Injector;

  constructor(@Optional() @SkipSelf() parentModule: CoreModule, injector: Injector) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }

    CoreModule.injector = injector;
  }
}
