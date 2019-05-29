import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {NgModule, Optional, SkipSelf} from '@angular/core';
import {BrowserXhr} from '@angular/http';
import {RouterModule} from '@angular/router';
import {SimpleNotificationsModule} from 'angular2-notifications';

import {AddMemberComponent} from '../member/add-member/add-member.component';
import {EditMemberComponent} from '../member/edit-member/edit-member.component';
import {AddServiceAccountComponent} from '../serviceaccount/add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from '../serviceaccount/edit-serviceaccount/edit-serviceaccount.component';
import {AddServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from '../serviceaccount/serviceaccount-token/edit-serviceaccount-token/edit-serviceaccount-token.component';
import {TokenDialogComponent} from '../serviceaccount/serviceaccount-token/token-dialog/token-dialog.component';
import {SharedModule} from '../shared/shared.module';

import {FooterComponent} from './components/footer/footer.component';
import {NavigationComponent} from './components/navigation/navigation.component';
import {NotificationComponent} from './components/notification/notification.component';
import {SidenavComponent} from './components/sidenav/sidenav.component';
import {CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor, AuthInterceptor} from './interceptors';
import {ApiService, Auth, AuthGuard, AuthzGuard, ClusterService, DatacenterService, ParamsService} from './services';
import {WizardService} from './services';
import {NodeDataService} from './services/node-data/node-data.service';
import {StepsService} from './services/wizard/steps.service';
import {ClusterNameGenerator} from './util/name-generator.service';
import {ProgressBrowserXhr} from './util/ProgressBrowserXhr';
import {ProjectSelectorComponent} from "./components/sidenav/project/selector.component";

const modules: any[] = [
  CommonModule,
  HttpClientModule,
  RouterModule,
  SharedModule,
  SimpleNotificationsModule.forRoot(),
];

const components: any[] = [
  SidenavComponent,
  ProjectSelectorComponent,
  NavigationComponent,
  NotificationComponent,
  AddMemberComponent,
  EditMemberComponent,
  AddServiceAccountComponent,
  EditServiceAccountComponent,
  AddServiceAccountTokenComponent,
  EditServiceAccountTokenComponent,
  TokenDialogComponent,
  FooterComponent,
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
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr,
    },
    ...interceptors,
  ],
  exports: [
    ...components,
  ],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
