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
import {ChangelogDialog} from '@core/components/changelog/dialog';
import {HelpPanelComponent} from '@core/components/help-panel/component';
import {ApiService} from '@core/services/api';
import {AuthGuard, AuthzGuard} from '@core/services/auth/guard';
import {Auth} from '@core/services/auth/service';
import {ChangelogManagerService} from '@core/services/changelog/listener';
import {ChangelogService} from '@core/services/changelog/service';
import {ClusterService} from '@core/services/cluster';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {EndOfLifeService} from '@core/services/eol';
import {HistoryService} from '@core/services/history';
import {LabelService} from '@core/services/label';
import {OPAService} from '@core/services/opa';
import {ParamsService} from '@core/services/params';
import {RBACService} from '@core/services/rbac';
import {PresetsService} from '@core/services/wizard/presets';
import {SharedModule} from '@shared/module';
import {COOKIE, COOKIE_DI_TOKEN} from '../config';
import {AddMemberComponent} from '../member/add-member/component';
import {EditMemberComponent} from '../member/edit-member/component';
import {AddServiceAccountComponent} from '../serviceaccount/add-serviceaccount/component';
import {EditServiceAccountComponent} from '../serviceaccount/edit-serviceaccount/component';
import {FooterComponent} from './components/footer/component';
import {NavigationComponent} from './components/navigation/component';
import {ProjectSelectorComponent} from './components/navigation/project/component';
import {NotificationPanelComponent} from './components/notification-panel/component';
import {SidenavComponent} from './components/sidenav/component';
import {UserPanelComponent} from './components/user-panel/component';
import {AuthInterceptor, CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor} from './interceptors';
import {GlobalModule} from './services/global/module';
import {NameGeneratorService} from './services/name-generator';
import {PageTitleService} from './services/page-title';
import {PreviousRouteService} from './services/previous-route';
import {SettingsService} from './services/settings';
import {ThemeInformerService} from './services/theme-informer';
import {TokenService} from './services/token';
import {StepsService} from './services/wizard/steps';

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
  FooterComponent,
  NotificationPanelComponent,
  UserPanelComponent,
  ChangelogDialog,
  HelpPanelComponent,
];

const services: any[] = [
  Auth,
  AuthGuard,
  AuthzGuard,
  DatacenterService,
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
  ChangelogService,
  ChangelogManagerService,
  ClusterSpecService,
  EndOfLifeService,
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
