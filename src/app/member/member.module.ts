import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {MemberDeleteConfirmationComponent} from './member-delete-confirmation/member-delete-confirmation.component';
import {MemberItemComponent} from './member-item/member-item.component';
import {MemberRoutingModule} from './member-routing.module';
import {MemberComponent} from './member.component';

const components: any[] = [
  MemberComponent,
  MemberItemComponent,
  MemberDeleteConfirmationComponent,
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
  entryComponents: [MemberDeleteConfirmationComponent],
})
export class MemberModule {
}
