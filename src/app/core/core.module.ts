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
import {COOKIE, COOKIE_DI_TOKEN} from '../app.config';

import {AddMemberComponent} from '../member/add-member/add-member.component';
import {EditMemberComponent} from '../member/edit-member/edit-member.component';
import {AddServiceAccountComponent} from '../serviceaccount/add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from '../serviceaccount/edit-serviceaccount/edit-serviceaccount.component';
import {AddServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/edit-serviceaccount-token/edit-serviceaccount-token.component';
import {SharedModule} from '../shared/shared.module';

import {FooterComponent} from './components/footer/footer.component';
import {NavigationComponent} from './components/navigation/navigation.component';
import {ProjectSelectorComponent} from './components/navigation/project/selector.component';
import {NotificationPanelComponent} from './components/notification-panel/notification-panel.component';
import {SidenavComponent} from './components/sidenav/sidenav.component';
import {AuthInterceptor, CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor} from './interceptors';
import {
  ApiService,
  Auth,
  AuthGuard,
  AuthzGuard,
  ClusterService,
  DatacenterService,
  HistoryService,
  LabelService,
  ParamsService,
  PresetsService,
  RBACService,
  WizardService,
} from './services';
import {GlobalModule} from './services/global/global.module';
import {NodeDataService} from './services/node-data/node-data.service';
import {PreviousRouteService} from './services/previous-route/previous-route.service';
import {PageTitleService} from './services/page-title/page-title.service';
import {SettingsService} from './services/settings/settings.service';
import {TokenService} from './services/token/token.service';
import {StepsService} from './services/wizard/steps.service';
import {ClusterNameGenerator} from './util/name-generator.service';
import {ThemeInformerService} from './services/theme-informer/theme-informer.service';
import {UserPanelComponent} from './components/user-panel/user-panel.component';

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
  WizardService,
  StepsService,
  ClusterNameGenerator,
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
