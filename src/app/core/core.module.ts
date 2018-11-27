import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {APP_INITIALIZER, NgModule, Optional, SkipSelf} from '@angular/core';
import {BrowserXhr} from '@angular/http';
import {RouterModule} from '@angular/router';
import {SimpleNotificationsModule} from 'angular2-notifications';
import {AddProjectComponent} from '../add-project/add-project.component';
import {AddMemberComponent} from '../member/add-member/add-member.component';
import {EditMemberComponent} from '../member/edit-member/edit-member.component';
import {SharedModule} from '../shared/shared.module';
import {BreadcrumbsComponent} from './components/breadcrumbs/breadcrumbs.component';
import {NavigationComponent} from './components/navigation/navigation.component';
import {NotificationComponent} from './components/notification/notification.component';
import {SidenavComponent} from './components/sidenav/sidenav.component';
import {SidenavService} from './components/sidenav/sidenav.service';
import {CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor} from './interceptors';
import {ApiService, Auth, AUTH_PROVIDERS, AuthGuard, ClusterService, DatacenterService, HealthService, InitialNodeDataService} from './services';
import {AddNodeService} from './services/add-node/add-node.service';
import {StepsService} from './services/wizard/steps.service';
import {WizardService} from './services/wizard/wizard.service';
import {ClusterNameGenerator} from './util/name-generator.service';
import {ProgressBrowserXhr} from './util/ProgressBrowserXhr';

const modules: any[] = [
  CommonModule,
  HttpClientModule,
  RouterModule,
  SharedModule,
  SimpleNotificationsModule.forRoot(),
];

const components: any[] = [
  SidenavComponent,
  NavigationComponent,
  BreadcrumbsComponent,
  NotificationComponent,
  AddProjectComponent,
  AddMemberComponent,
  EditMemberComponent,
];

const services: any[] = [
  AUTH_PROVIDERS,
  Auth,
  AuthGuard,
  DatacenterService,
  AddNodeService,
  WizardService,
  StepsService,
  ClusterNameGenerator,
  SidenavService,
  ApiService,
  InitialNodeDataService,
  ClusterService,
  HealthService,
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
];

export function init(api: ApiService): () => Promise<any> {
  return () => api.init();
}

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
    {
      provide: APP_INITIALIZER,
      useFactory: init,
      deps: [ApiService],
      multi: true,
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
