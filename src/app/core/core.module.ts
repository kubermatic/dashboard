import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { HttpModule, BrowserXhr } from "@angular/http";
import { RouterModule } from '@angular/router';

import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';

import { SidenavService } from './components/sidenav/sidenav.service';
import { ClusterNameGenerator } from './util/name-generator.service';
import { ProgressBrowserXhr } from './util/ProgressBrowserXhr';
import { SharedModule } from 'app/shared/shared.module';
import { 
  CreateNodesService,
  CustomEventService,
  DatacenterService,
  InputValidationService,
  LocalStorageService,
  AUTH_PROVIDERS,
  Auth,
  AuthGuard } from './services';
import { 
  LoaderInterceptor, 
  CheckTokenInterceptor, 
  ErrorNotificationsInterceptor } from './interceptors';

const modules: any[] = [
  CommonModule,
  HttpModule,
  HttpClientModule,
  RouterModule,
  SharedModule
];

const components: any[] = [
  SidenavComponent,
  NavigationComponent,
  BreadcrumbsComponent
];

const services: any[] = [
  AUTH_PROVIDERS,
  Auth,
  AuthGuard,
  CreateNodesService,
  CustomEventService,
  DatacenterService,
  InputValidationService,
  LocalStorageService,
  ClusterNameGenerator,
  SidenavService
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
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
      if (parentModule) {
          throw new Error('CoreModule is already loaded. Import it in the AppModule only');
      }
  }
}
