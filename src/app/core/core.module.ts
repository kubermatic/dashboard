import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserXhr } from '@angular/http';
import { RouterModule } from '@angular/router';
/* Modules */
import { SharedModule } from './../shared/shared.module';
import { SimpleNotificationsModule } from 'angular2-notifications';
/* Components */
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { NotificationComponent } from './components/notification/notification.component';
import { AddProjectComponent } from '../add-project/add-project.component';
import { AddMemberComponent } from '../member/add-member/add-member.component';
/* Services */
import { ClusterNameGenerator } from './util/name-generator.service';
import { ProgressBrowserXhr } from './util/ProgressBrowserXhr';
import { SidenavService } from './components/sidenav/sidenav.service';
import { ApiService, Auth, AUTH_PROVIDERS, AuthGuard, DatacenterService, InitialNodeDataService, ClusterService, HealthService } from './services';
/* Interceptors */
import { CheckTokenInterceptor, ErrorNotificationsInterceptor, LoaderInterceptor } from './interceptors';
import { AddNodeService } from './services/add-node/add-node.service';
import { WizardService } from './services/wizard/wizard.service';
import { StepsService } from './services/wizard/steps.service';

const modules: any[] = [
  CommonModule,
  HttpClientModule,
  RouterModule,
  SharedModule,
  SimpleNotificationsModule.forRoot()
];

const components: any[] = [
  SidenavComponent,
  NavigationComponent,
  BreadcrumbsComponent,
  NotificationComponent,
  AddProjectComponent,
  AddMemberComponent
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
  HealthService
];

const interceptors: any[] = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorNotificationsInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: CheckTokenInterceptor,
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: LoaderInterceptor,
    multi: true
  }
];

@NgModule({
  imports: [
    ...modules
  ],
  declarations: [
    ...components
  ],
  providers: [
    ...services,
    ...interceptors,
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr
    }
  ],
  exports: [
    ...components
  ]
})

export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
