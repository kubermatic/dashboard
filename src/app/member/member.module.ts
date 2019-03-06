import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {MemberRoutingModule} from './member-routing.module';
import {MemberComponent} from './member.component';

const components: any[] = [
  MemberComponent,
];

@NgModule({
  imports: [
    SharedModule,
    MemberRoutingModule,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
  entryComponents: [],
})
export class MemberModule {
}
