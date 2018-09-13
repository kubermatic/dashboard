import { NgModule } from '@angular/core';
import { MemberComponent } from './member.component';
import { MemberItemComponent } from './member-item/member-item.component';
import { SharedModule } from '../shared/shared.module';
import { MatTabsModule } from '@angular/material';
import { MemberRoutingModule } from './member-routing.module';
import { MemberDeleteConfirmationComponent } from './member-delete-confirmation/member-delete-confirmation.component';

const components: any[] = [
  MemberComponent,
  MemberItemComponent,
  MemberDeleteConfirmationComponent
];

@NgModule({
  imports: [
    SharedModule,
    MatTabsModule,
    MemberRoutingModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ],
  entryComponents: [MemberDeleteConfirmationComponent]
})
export class MemberModule {
}
