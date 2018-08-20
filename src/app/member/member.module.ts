import { NgModule } from '@angular/core';
import { MemberComponent } from './member.component';
import { SharedModule } from '../shared/shared.module';
import { MatTabsModule } from '@angular/material';
import { MemberRoutingModule } from './member-routing.module';

const components: any[] = [
  MemberComponent
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
  entryComponents: []
})
export class MemberModule {
}
