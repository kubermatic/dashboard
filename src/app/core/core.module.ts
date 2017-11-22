import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from "@angular/common/http";

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
  LocalStorageService
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
    CommonModule
  ],
  declarations: [],
  providers: [
    ...services,
    ...interceptors
  ]
})
export class CoreModule {
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
      if (parentModule) {
          throw new Error('CoreModule is already loaded. Import it in the AppModule only');
      }
  }
}
