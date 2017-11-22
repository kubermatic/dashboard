import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { HttpModule, BrowserXhr } from "@angular/http";

import { ClusterNameGenerator } from './util/name-generator.service';
import { ProgressBrowserXhr } from './util/ProgressBrowserXhr';
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

const services: any[] = [
  AUTH_PROVIDERS,
  Auth,
  AuthGuard,
  CreateNodesService,
  CustomEventService,
  DatacenterService,
  InputValidationService,
  LocalStorageService,
  ClusterNameGenerator
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
    CommonModule,
    HttpModule,
    HttpClientModule,
  ],
  declarations: [],
  providers: [
    ...services,
    ...interceptors,
    {
      provide: BrowserXhr,
      useClass: ProgressBrowserXhr
    }
  ]
})
export class CoreModule {
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
      if (parentModule) {
          throw new Error('CoreModule is already loaded. Import it in the AppModule only');
      }
  }
}
