import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from "@ngrx/store";
import {HttpModule, BrowserXhr} from "@angular/http";
import {HttpClientModule} from "@angular/common/http";

import {
  CreateNodesService,
  CustomEventService,
  DatacenterService,
  InputValidationService,
  LocalStorageService,
  AUTH_PROVIDERS,
  Auth,
  AuthGuard
} from './services';

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

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    ...services
  ]
})
export class CoreModule {
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
      if (parentModule) {
          throw new Error('CoreModule is already loaded. Import it in the AppModule only');
      }
  }
}
