import {NgModule} from '@angular/core';

import {SharedModule} from '../shared/shared.module';
import {ServiceAccountRoutingModule} from './serviceaccount-routing.module';
import {ServiceAccountTokenComponent} from './serviceaccount-token/serviceaccount-token.component';
import {ServiceAccountComponent} from './serviceaccount.component';

const components: any[] = [
  ServiceAccountComponent,
  ServiceAccountTokenComponent,
];

@NgModule({
  imports: [
    SharedModule,
    ServiceAccountRoutingModule,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
  entryComponents: [],
})
export class ServiceAccountModule {
}
