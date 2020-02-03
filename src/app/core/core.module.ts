import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {Injector, NgModule, Optional, SkipSelf} from '@angular/core';
import {RouterModule} from '@angular/router';

import {AddMemberComponent} from '../member/add-member/add-member.component';
import {EditMemberComponent} from '../member/edit-member/edit-member.component';
import {AddServiceAccountComponent} from '../serviceaccount/add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from '../serviceaccount/edit-serviceaccount/edit-serviceaccount.component';
import {AddServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/edit-serviceaccount-token/edit-serviceaccount-token.component';
import {SharedModule} from '../shared/shared.module';

import {FooterComponent} from './components/footer/footer.component';
import {NavigationComponent} from './components/navigation/navigation.component';
import {ProjectSelectorComponent} from './components/sidenav/project/selector.component';
import {SidenavComponent} from './components/sidenav/sidenav.component';
import {AuthInterceptor, CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor} from './interceptors';
import {ApiService, Auth, AuthGuard, AuthzGuard, ClusterService, DatacenterService, HistoryService, LabelService, NewWizardService, ParamsService, PresetsService, RBACService, WizardService,} from './services';
import {GlobalModule} from './services/global/global.module';
import {NodeDataService} from './services/node-data/node-data.service';
import {PreviousRouteService} from './services/previous-route/previous-route.service';
import {SettingsService} from './services/settings/settings.service';
import {StepsService} from './services/wizard/steps.service';
import {ClusterNameGenerator} from './util/name-generator.service';

const modules: any[] = [
  CommonModule,
  HttpClientModule,
  RouterModule,
  SharedModule,
  GlobalModule,
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
];

const services: any[] = [
  Auth,
  AuthGuard,
  AuthzGuard,
  DatacenterService,
  NodeDataService,
  WizardService,
  NewWizardService,
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
  }
];

@NgModule({
  imports: [
    ...modules,
  ],
  declarations: [
    ...components,
  ],
  providers: [
    ...services,
    ...interceptors,
  ],
  exports: [
    ...components,
  ],
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
