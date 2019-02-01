import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {MemberItemComponent} from './member-item/member-item.component';
import {MemberRoutingModule} from './member-routing.module';
import {MemberComponent} from './member.component';

const components: any[] = [
  MemberComponent,
  MemberItemComponent,
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
