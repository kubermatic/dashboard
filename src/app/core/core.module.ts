import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CreateNodesService,
  CustomEventService,
  DatacenterService,
  InputValidationService,
  LocalStorageService
} from './services';

const services: any[] = [
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
